import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { FilterProjectsInterface } from '../interfaces/filter-projects.interface';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { ProjectParticipation } from '../entities/project-participation.entity';
import { ProjectParticipationUpvote } from '../entities/participation-upvote.entity';
import { ProjectParticipationReview } from '../entities/project-participation-review.entity';
import { UsersService } from '@/modules/users/services/users.service';
import { VenturesService } from '../../../ventures/ventures/services/ventures.service';
import { User } from '@/modules/users/entities/user.entity';
import { ParticipateProjectDto } from '../dto/participate.dto';
import { MoveParticipantsDto } from '../dto/move-participants.dto';
import { PhasesService } from '../../../projects/phases/services/phases.service';
import { parseUsersCsv } from '@/modules/users/helpers/user-csv.helper';
import { FilterParticipationsInterface } from '../interfaces/filter-participations.interface';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ParticipationReviewDto } from '../dto/participation-review.dto';
import { Phase } from '../../../projects/phases/entities/phase.entity';
import { UpdateParticipationReviewDto } from '../dto/update-participation-review.dto';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { Notification } from '../../../notifications/entities/notification.entity';
import { CreateNotificationDto } from '../../../notifications/dto/create-notification.dto';
import { MentorsService } from '../../../mentors/mentors/services/mentors.service';
import { promises as fs, existsSync } from 'fs';
import { Gallery } from '../../../galleries/entities/gallery.entity';
import { GalleriesService } from '../../../galleries/services/galleries.service';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'path';
import { htmlToText } from 'html-to-text';

@Injectable()
export class ProjectsService extends AbstractRepository<Project> {
  private readonly PAGINATION_LIMIT = 20;
  private readonly PROMOTION_SCORE = 60;

  constructor(
    @InjectRepository(Project)
    repository: Repository<Project>,
    @InjectRepository(ProjectParticipation)
    private readonly participationRepository: Repository<ProjectParticipation>,
    @InjectRepository(ProjectParticipationUpvote)
    private readonly upvoteRepository: Repository<ProjectParticipationUpvote>,
    @InjectRepository(ProjectParticipationReview)
    private readonly reviewRepository: Repository<ProjectParticipationReview>,
    private readonly usersService: UsersService,
    private readonly phasesService: PhasesService,
    private readonly venturesService: VenturesService,
    private readonly notificationsService: NotificationsService,
    private readonly mentorsService: MentorsService,
    private readonly galleriesService: GalleriesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailerService: MailerService
  ) {
    super(repository);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    return await this.createEntity({
      ...dto,
      project_manager: { id: dto.project_manager },
      program: { id: dto.program },
      categories: dto.categories.map((id) => ({ id }))
    });
  }

  async findAll(queryParams: FilterProjectsInterface): Promise<[Project[], number]> {
    const { page, categories, q, filter = 'all' } = queryParams;
    const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
    const query = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categories', 'categories')
      .loadRelationCountAndMap('p.participantsCount', 'p.participations')
      .orderBy('p.updated_at', 'DESC');
    if (filter === 'published') query.andWhere('p.is_published = :isPublished', { isPublished: true });
    if (filter === 'drafts') query.andWhere('p.is_published = :isPublished', { isPublished: false });
    if (filter === 'highlighted') query.andWhere('p.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
    if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
    return await this.findPaginatedEntities(query, { page, take: 20 });
  }

  async findPublished(queryParams: FilterProjectsInterface): Promise<[Project[], number]> {
    try {
      const { page, categories, q, status } = queryParams;
      const categoryIds = Array.isArray(categories) ? categories : categories ? [categories] : [];
      const query = this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .andWhere('p.is_published = :is_published', { is_published: true });
      if (q) query.andWhere('(p.name LIKE :q OR p.description LIKE :q)', { q: `%${q}%` });
      if (categoryIds.length) query.andWhere('categories.id IN (:...categoryIds)', { categoryIds });
      if (status === 'past') query.andWhere('p.ended_at < NOW()');
      if (status === 'current') query.andWhere('p.started_at <= NOW() AND p.ended_at >= NOW()');
      if (status === 'future') query.andWhere('p.started_at > NOW()');
      return await this.findPaginatedEntities(query.orderBy('p.started_at', 'DESC'), { page, take: 40 });
    } catch {
      throw new BadRequestException('Projets publiés introuvables');
    }
  }

  async findMentorProjects(userId: string): Promise<Project[]> {
    try {
      return await this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .leftJoinAndSelect('p.phases', 'phases')
        .leftJoinAndSelect('phases.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .loadRelationCountAndMap('p.participantsCount', 'p.participations')
        .where('owner.id = :userId', { userId })
        .orderBy('p.updated_at', 'DESC')
        .addOrderBy('phases.started_at', 'ASC')
        .getMany();
    } catch {
      throw new BadRequestException('Projets mentorés introuvables');
    }
  }

  async findRecent(): Promise<Project[]> {
    return await this.findEntities({ order: { ended_at: 'DESC' }, where: { is_published: true }, take: 6 });
  }

  async findBySlug(slug: string): Promise<Project> {
    try {
      return await this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.categories', 'categories')
        .leftJoinAndSelect('p.project_manager', 'project_manager')
        .leftJoinAndSelect('p.program', 'program')
        .leftJoinAndSelect('p.gallery', 'gallery')
        .leftJoinAndSelect('p.phases', 'phases')
        .leftJoinAndSelect('phases.mentors', 'mentors')
        .leftJoinAndSelect('mentors.owner', 'owner')
        .leftJoinAndSelect('phases.deliverables', 'deliverables')
        .loadRelationCountAndMap('phases.participationsCount', 'phases.participations')
        .where('p.slug = :slug', { slug })
        .orderBy('phases.started_at', 'ASC')
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Projet introuvable');
    }
  }

  async findOne(projectId: string): Promise<Project> {
    return await this.findEntity({
      where: { id: projectId },
      relations: ['categories', 'project_manager', 'gallery']
    });
  }

  async findOneWithParticipations(projectId: string): Promise<Project> {
    return await this.findEntity({ where: { id: projectId }, relations: ['participations', 'participations.user'] });
  }

  async toggleHighlight(projectId: string): Promise<Project> {
    const project = await this.findEntity({ where: { id: projectId } });
    return await this.updateEntity(projectId, { is_highlighted: !project.is_highlighted });
  }

  async togglePublish(projectId: string): Promise<Project> {
    const project = await this.findEntity({ where: { id: projectId } });
    return await this.updateEntity(projectId, { is_published: !project.is_published });
  }

  async addCover(projectId: string, cover: string): Promise<Project> {
    return await this.updateEntity(projectId, { cover });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    return await this.updateEntity(id, {
      ...dto,
      project_manager: { id: dto.project_manager },
      program: { id: dto.program },
      categories: dto.categories ? dto.categories.map((type) => ({ id: type })) : null
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async findUserParticipations(userId: string): Promise<ProjectParticipation[]> {
    try {
      return await this.participationRepository.find({
        where: { user: { id: userId } },
        relations: ['project', 'project.phases', 'phases', 'venture', 'reviews', 'reviews.phase']
      });
    } catch {
      throw new BadRequestException("Impossible de récupérer les participations de l'utilisateur");
    }
  }

  async moveParticipants(dto: MoveParticipantsDto): Promise<void> {
    try {
      const phase = await this.phasesService.findOne(dto.phaseId);
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      const toUpdate = participations.filter((participation) => {
        const alreadyInPhase = participation.phases?.some((entry) => entry.id === phase.id);
        if (!alreadyInPhase) {
          participation.phases = [...(participation.phases ?? []), phase];
          return true;
        }
        return false;
      });
      if (toUpdate.length > 0) {
        await this.participationRepository.save(toUpdate);
      }
    } catch {
      throw new BadRequestException('Impossible de déplacer les participants vers la phase');
    }
  }

  async removeParticipantsFromPhase(dto: MoveParticipantsDto): Promise<void> {
    try {
      const participations = await this.participationRepository.find({
        where: { id: In(dto.ids) },
        relations: ['phases']
      });
      participations.forEach((participation) => {
        participation.phases = (participation.phases ?? []).filter((phase) => phase.id !== dto.phaseId);
      });
      await this.participationRepository.save(participations);
      await this.removeHistoryForPhase(dto.ids, dto.phaseId);
    } catch {
      throw new BadRequestException('Impossible de retirer les participants de la phase');
    }
  }

  async saveParticipations(participations: ProjectParticipation[]): Promise<void> {
    try {
      await this.participationRepository.save(participations);
    } catch {
      throw new BadRequestException('Mise à jour des participants impossible');
    }
  }

  async findParticipations(
    projectId: string,
    queryParams: FilterParticipationsInterface
  ): Promise<[ProjectParticipation[], number]> {
    try {
      const { page = 1, phaseId, q } = queryParams;
      const skip = (+page - 1) * this.PAGINATION_LIMIT;
      const query = this.participationRepository
        .createQueryBuilder('pp')
        .leftJoinAndSelect('pp.user', 'user')
        .leftJoinAndSelect('pp.venture', 'venture')
        .leftJoinAndSelect('pp.project', 'project')
        .leftJoinAndSelect('pp.phases', 'phases')
        .leftJoinAndSelect('pp.reviews', 'reviews')
        .leftJoinAndSelect('reviews.phase', 'review_phase')
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.projectId = :projectId', { projectId })
        .orderBy('pp.created_at', 'DESC')
        .distinct(true);
      if (q) query.andWhere('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      if (phaseId) query.andWhere('phases.id = :phaseId', { phaseId });
      return await query.skip(skip).take(this.PAGINATION_LIMIT).getManyAndCount();
    } catch {
      throw new BadRequestException('Impossible de récupérer les participations du projet');
    }
  }

  async findParticipantUsersByProject(projectId: string): Promise<User[]> {
    try {
      await this.findOne(projectId);
      const participations = await this.participationRepository.find({
        where: { project: { id: projectId } },
        relations: ['user']
      });
      return this.mapUniqueUsers(participations);
    } catch {
      throw new BadRequestException('Impossible de récupérer les participants du projet');
    }
  }

  async findParticipantUsersByPhase(phaseId: string): Promise<User[]> {
    try {
      const participations = await this.participationRepository.find({
        where: { phases: { id: phaseId } },
        relations: ['user']
      });
      return this.mapUniqueUsers(participations);
    } catch {
      throw new BadRequestException('Impossible de récupérer les participants de la phase');
    }
  }

  async findParticipation(participationId: string): Promise<ProjectParticipation> {
    try {
      return await this.participationRepository
        .createQueryBuilder('pp')
        .leftJoinAndSelect('pp.user', 'user')
        .leftJoinAndSelect('pp.venture', 'venture')
        .leftJoinAndSelect('pp.project', 'project')
        .leftJoinAndSelect('project.categories', 'categories')
        .leftJoinAndSelect('project.phases', 'project_phases')
        .leftJoinAndSelect('pp.phases', 'phases')
        .leftJoinAndSelect('pp.reviews', 'reviews')
        .leftJoinAndSelect('reviews.reviewer', 'reviewer')
        .leftJoinAndSelect('reviews.phase', 'review_phase')
        .loadRelationCountAndMap('pp.upvotesCount', 'pp.upvotes')
        .where('pp.id = :participationId', { participationId })
        .getOneOrFail();
    } catch {
      throw new NotFoundException('Participation introuvable');
    }
  }

  async ensureParticipationExists(participationId: string): Promise<void> {
    try {
      await this.participationRepository.findOneOrFail({ where: { id: participationId } });
    } catch {
      throw new NotFoundException('Participation introuvable');
    }
  }

  async importParticipants(projectId: string, file: Express.Multer.File): Promise<void> {
    try {
      const project = await this.findOneWithParticipations(projectId);
      const rows = await parseUsersCsv(file.buffer);
      const existingUserIds = new Set<string>(
        project.participations?.map((participation) => participation?.user?.id).filter(Boolean) ?? []
      );
      const newUserIds = new Set<string>();
      for (const row of rows) {
        const user = await this.usersService.findOrCreate(row);
        if (user?.id && !existingUserIds.has(user.id)) {
          newUserIds.add(user.id);
        }
      }
      if (newUserIds.size === 0) return;
      await this.participationRepository.save(
        [...newUserIds].map((userId) => ({
          created_at: project.started_at,
          user: { id: userId },
          project: { id: projectId }
        }))
      );
    } catch {
      throw new BadRequestException("Impossible d'importer les participants");
    }
  }

  async participate(projectId: string, userId: string, dto: ParticipateProjectDto): Promise<void> {
    try {
      await this.findOne(projectId);
      const venture = await this.venturesService.findOne(dto.ventureId);
      await this.participationRepository.save({
        user: { id: userId },
        project: { id: projectId },
        venture: venture ? { id: venture.id } : null
      });
    } catch {
      throw new BadRequestException('Impossible de participer au projet');
    }
  }

  async upvote(id: string, userId: string): Promise<void> {
    try {
      await this.upvoteRepository.save({
        participation: { id },
        user: { id: userId }
      });
    } catch {
      throw new BadRequestException('Impossible de voter pour cette participation');
    }
  }

  async unvote(id: string, userId: string): Promise<void> {
    try {
      const upvote = await this.upvoteRepository.findOneOrFail({
        where: { participation: { id }, user: { id: userId } }
      });
      await this.upvoteRepository.remove(upvote);
    } catch {
      throw new BadRequestException('Impossible de retirer le vote');
    }
  }

  async removeHistoryForPhase(participationIds: string[], phaseId: string): Promise<void> {
    try {
      await this.reviewRepository.delete({
        participation: { id: In(participationIds) },
        phase: { id: phaseId }
      });
    } catch {
      throw new BadRequestException("Suppression de l'historique impossible");
    }
  }

  async createReview(
    participationId: string,
    reviewerId: string,
    dto: ParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    try {
      const participation = await this.findParticipation(participationId);
      const phase = await this.phasesService.findOne(dto.phaseId);
      this.ensureParticipationInPhase(participation, dto.phaseId);
      const existing = await this.reviewRepository.findOne({
        where: {
          participation: { id: participationId },
          phase: { id: dto.phaseId }
        }
      });
      if (existing) {
        throw new BadRequestException('Avis déjà enregistré');
      }
      const nextPhase = this.findNextPhase(participation.project?.phases ?? [], dto.phaseId, false);
      const review = await this.reviewRepository.save({
        participation: { id: participationId },
        phase: { id: dto.phaseId },
        reviewer: { id: reviewerId },
        message: dto.message ?? null,
        score: dto.score
      });
      await this.updateParticipationPhases(participation, dto.score, false, nextPhase);
      await this.notifyParticipantIfNeeded(participation, phase, dto, nextPhase);
      return review;
    } catch {
      throw new BadRequestException('Score impossible à enregistrer');
    }
  }

  async updateReview(
    participationId: string,
    reviewId: string,
    reviewerId: string,
    dto: UpdateParticipationReviewDto
  ): Promise<ProjectParticipationReview> {
    try {
      const participation = await this.findParticipation(participationId);
      const existing = await this.findReview(reviewId, participationId);
      const phase = await this.phasesService.findOne(existing.phase.id);
      this.ensureParticipationInPhase(participation, existing.phase.id);
      const nextPhase = this.findNextPhase(participation.project?.phases ?? [], existing.phase.id, false);
      await this.reviewRepository.update(existing.id, {
        participation: { id: participationId },
        phase: { id: existing.phase.id },
        reviewer: { id: reviewerId },
        message: dto.message ?? null,
        score: dto.score
      });
      const review = await this.reviewRepository.findOneByOrFail({ id: existing.id });
      await this.updateParticipationPhases(participation, dto.score, true, nextPhase);
      await this.notifyParticipantIfNeeded(participation, phase, dto, nextPhase);
      return review;
    } catch {
      throw new BadRequestException('Score impossible à enregistrer');
    }
  }

  async createNotification(projectId: string, userId: string, dto: CreateNotificationDto): Promise<Notification> {
    try {
      await this.findOne(projectId);
      const notification = await this.notificationsService.create(projectId, userId, dto);
      return this.notificationsService.findOne(notification.id);
    } catch {
      throw new BadRequestException('Création de notification impossible');
    }
  }

  async sendNotification(notificationId: string): Promise<Notification> {
    try {
      const notification = await this.notificationsService.findOne(notificationId);
      let recipients: User[] = [];
      if (notification.notify_staff) {
        recipients = await this.usersService.findStaff();
      } else if (notification.notify_mentors) {
        recipients = await this.mentorsService.findUsersByPhase(notification.phase.id);
      } else if (notification.phase) {
        recipients = await this.findParticipantUsersByPhase(notification.phase.id);
      } else {
        recipients = await this.findParticipantUsersByProject(notification.project.id);
      }
      this.eventEmitter.emit('notify.participants', recipients, notification);
      return await this.notificationsService.send(notificationId);
    } catch {
      throw new BadRequestException('Envoi de notification impossible');
    }
  }

  async addImage(projectId: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.findOne(projectId);
      const galleryDto = {
        image: file.filename,
        project: { id: projectId }
      };
      await this.galleriesService.create(galleryDto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeImage(id: string): Promise<void> {
    try {
      await this.galleriesService.remove(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('project', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async uploadCover(projectId: string, file: Express.Multer.File): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      if (project.cover) {
        await fs.unlink(`./uploads/projects/${project.cover}`).catch(() => undefined);
      }
      return await this.addCover(projectId, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }

  @OnEvent('participation.review')
  async sendParticipationReview(payload: {
    user: User;
    project: Project;
    phase: Phase;
    score: number;
    message?: string;
    nextPhase?: Phase | null;
  }): Promise<void> {
    try {
      const { user, project, phase, score, message, nextPhase } = payload;
      const email = user?.email?.trim();
      if (!email) return;
      const status = score >= 60 ? 'retenue' : 'non retenue';
      const nextPhaseLine = nextPhase
        ? `<p><strong>Prochaine phase:</strong> ${nextPhase.name}</p>`
        : score >= 60
          ? '<p>Aucune autre phase n’est disponible pour ce projet.</p>'
          : '';
      const reviewerMessage = message ? `<p><strong>Message du reviewer:</strong> ${message}</p>` : '';
      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
          <p>Bonjour ${user?.name ?? ''},</p>
          <p>Votre participation au projet <strong>${project?.name ?? ''}</strong> pour la phase <strong>${phase?.name ?? ''}</strong> est ${status}.</p>
          <p><strong>Score:</strong> ${score}/100</p>
          ${reviewerMessage}
          ${nextPhaseLine}
        </div>
      `;
      const text = htmlToText(html, {
        wordwrap: 120,
        selectors: [{ selector: 'img', format: 'skip' }]
      });
      await this.mailerService.sendMail({
        to: email,
        subject: `${project?.name ?? 'Projet'} - Mise à jour de participation`,
        html,
        text
      });
    } catch {
      return;
    }
  }

  @OnEvent('notify.participants')
  async notifyParticipants(recipients: User[] = [], notification: Notification): Promise<void> {
    const emails = Array.from(new Set(recipients.map((recipient) => recipient?.email?.trim())));
    if (emails.length === 0) return;
    const attachments = this.resolveExistingAttachments(notification);
    const subject = `${notification.project?.name ?? 'Project'} - ${notification.title}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
        <p><strong>Projet:</strong> ${notification.project?.name}</p>
        <hr />
        ${notification.body ?? ''}
      </div>
    `;
    const text = htmlToText(html, {
      wordwrap: 120,
      selectors: [{ selector: 'img', format: 'skip' }]
    });
    for (const email of emails) {
      try {
        await this.mailerService.sendMail({
          to: email,
          subject,
          html,
          text,
          ...(attachments?.length ? { attachments } : {})
        });
      } catch {
        continue;
      }
    }
  }

  private mapUniqueUsers(participations: ProjectParticipation[]): User[] {
    const seen = new Set<string>();
    return participations
      .map((participation) => participation?.user)
      .filter((user) => !!user)
      .filter((user) => {
        if (seen.has(user.id)) return false;
        seen.add(user.id);
        return true;
      });
  }

  private ensureParticipationInPhase(participation: ProjectParticipation, phaseId: string): void {
    const inPhase = participation.phases?.some((phase) => phase.id === phaseId);
    if (!inPhase) {
      throw new BadRequestException('Participant absent de la phase');
    }
  }

  private async findReview(reviewId: string, participationId: string): Promise<ProjectParticipationReview> {
    try {
      return await this.reviewRepository.findOneOrFail({
        where: { id: reviewId, participation: { id: participationId } },
        relations: ['phase']
      });
    } catch {
      throw new BadRequestException('Avis introuvable');
    }
  }

  private async updateParticipationPhases(
    participation: ProjectParticipation,
    score: number,
    hasExistingReview: boolean,
    nextPhase: Phase | null
  ): Promise<void> {
    const currentPhases = participation.phases ?? [];
    if (hasExistingReview && score < this.PROMOTION_SCORE) {
      if (!nextPhase) return;
      const updatedPhases = currentPhases.filter((phase) => phase.id !== nextPhase.id);
      if (updatedPhases.length === currentPhases.length) return;
      await this.saveParticipations([{ ...participation, phases: updatedPhases }]);
      return;
    }
    if (score < this.PROMOTION_SCORE || !nextPhase) return;
    const alreadyInNext = currentPhases.some((phase) => phase.id === nextPhase.id);
    if (alreadyInNext) return;
    await this.saveParticipations([{ ...participation, phases: [...currentPhases, nextPhase] }]);
  }

  private findNextPhase(phases: Phase[], currentPhaseId: string, throwWhenMissing = true): Phase | null {
    const sortedPhases = [...phases].sort((a, b) => {
      const left = new Date(a.started_at).getTime();
      const right = new Date(b.started_at).getTime();
      return left - right;
    });
    const currentIndex = sortedPhases.findIndex((phase) => phase.id === currentPhaseId);
    if (currentIndex === -1 && throwWhenMissing) {
      throw new BadRequestException('Phase introuvable dans le projet');
    }
    if (currentIndex === -1) return null;
    return sortedPhases[currentIndex + 1] ?? null;
  }

  private async notifyParticipantIfNeeded(
    participation: ProjectParticipation,
    phase: Phase,
    dto: ParticipationReviewDto | UpdateParticipationReviewDto,
    nextPhase: Phase | null
  ): Promise<void> {
    if (!dto.notifyParticipant) return;
    this.eventEmitter.emit('participation.review', {
      user: participation.user,
      project: participation.project,
      phase,
      score: dto.score,
      message: dto.message,
      nextPhase: dto.score >= this.PROMOTION_SCORE ? nextPhase : null
    });
  }

  private resolveExistingAttachments(notification: Notification) {
    const files = (notification.attachments || [])
      .map((attachment) => {
        const filePath = join(process.cwd(), 'uploads', 'notifications', attachment.filename);
        if (!existsSync(filePath)) return null;
        return { filename: attachment.filename, path: filePath };
      })
      .filter((attachment) => attachment !== null);
    return files.length ? files : undefined;
  }
}

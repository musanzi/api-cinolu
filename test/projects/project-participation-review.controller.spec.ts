import { ProjectParticipationReviewController } from '../../src/modules/projects/projects/controllers/project-participation-review.controller';

describe('ProjectParticipationReviewController', () => {
  const setup = () => {
    const reviewService = {
      createReview: jest.fn(),
      updateReview: jest.fn()
    } as any;

    const controller = new ProjectParticipationReviewController(reviewService);
    return { controller, reviewService };
  };

  it('createReview delegates to reviewService.createReview', async () => {
    const { controller, reviewService } = setup();
    const user = { id: 'reviewer-1' };
    const dto = { phaseId: 'phase-1', score: 80, message: 'Bien joue' };
    reviewService.createReview.mockResolvedValue({ id: 'r1' });

    await expect(controller.createReview('pp1', user as any, dto as any)).resolves.toEqual({ id: 'r1' });
    expect(reviewService.createReview).toHaveBeenCalledWith('pp1', user, dto);
  });

  it('updateReview delegates to reviewService.updateReview', async () => {
    const { controller, reviewService } = setup();
    const user = { id: 'reviewer-1' };
    const dto = { score: 55, message: 'A revoir' };
    reviewService.updateReview.mockResolvedValue({ id: 'r1' });

    await expect(controller.updateReview('pp1', 'r1', user as any, dto as any)).resolves.toEqual({ id: 'r1' });
    expect(reviewService.updateReview).toHaveBeenCalledWith('pp1', 'r1', user, dto);
  });
});

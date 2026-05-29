import { HighlightsService } from '@/modules/content/highlights/highlights.service';

describe('HighlightsService', () => {
  it('aggregates highlighted items from repositories', async () => {
    const find = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'p1' }])
      .mockResolvedValueOnce([{ id: 's1' }])
      .mockResolvedValueOnce([{ id: 'e1' }])
      .mockResolvedValueOnce([{ id: 'pr1' }])
      .mockResolvedValueOnce([{ id: 'a1' }]);
    const dataSource = { getRepository: jest.fn().mockReturnValue({ find }) } as any;

    const service = new HighlightsService(dataSource);
    await expect(service.findAll()).resolves.toEqual({
      programs: [{ id: 'p1' }],
      subprograms: [{ id: 's1' }],
      events: [{ id: 'e1' }],
      projects: [{ id: 'pr1' }],
      articles: [{ id: 'a1' }]
    });

    expect(dataSource.getRepository).toHaveBeenCalledTimes(5);
    expect(find).toHaveBeenCalledTimes(5);
    for (const call of find.mock.calls) {
      expect(call[0]).toEqual({ where: { is_highlighted: true } });
    }
  });

  it('propagates repository errors from any highlighted query', async () => {
    const find = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'p1' }])
      .mockRejectedValueOnce(new Error('db down'));
    const dataSource = { getRepository: jest.fn().mockReturnValue({ find }) } as any;
    const service = new HighlightsService(dataSource);

    await expect(service.findAll()).rejects.toThrow('db down');
  });
});

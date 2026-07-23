import { describe, expect, it, jest } from '@jest/globals';
import { CampaignService } from './campaign.service';

describe('CampaignService', () => {
  it('findAll should not require the client relation to load campaigns', async () => {
    const findMock = jest.fn().mockImplementation(() => Promise.resolve([{ id: 'campaign-1', agencyId: 'default-agency', name: 'Launch Campaign' }]));
    const campaignRepository = { find: findMock } as any;

    const service = new CampaignService(campaignRepository, {} as any, {} as any);

    const result = await service.findAll('default-agency');

    expect(result).toEqual([
      { id: 'campaign-1', agencyId: 'default-agency', name: 'Launch Campaign' },
    ]);
    expect(findMock).toHaveBeenCalled();
  });
});

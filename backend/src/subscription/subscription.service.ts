import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { PlanFeature } from './entities/plan-feature.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanFeature)
    private readonly planFeatureRepository: Repository<PlanFeature>,
  ) {}

  async getAllPlans(): Promise<any[]> {
    const plans = await this.planRepository.find();
    if (plans.length > 0) return plans;

    // Return default tier plans if database is not seeded
    return [
      {
        id: 'free',
        name: 'Free',
        price: '$0',
        features: ['5 campaigns', 'Basic analytics', 'Email support'],
        current: false,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '$199',
        features: ['Unlimited campaigns', 'Advanced analytics', 'Priority support', 'Team collaboration'],
        current: true,
      },
      {
        id: 'max',
        name: 'Max',
        price: '$499',
        features: ['Everything in Pro', 'API access', 'Custom integrations', 'Dedicated account manager'],
        current: false,
      },
    ];
  }

  async getCurrentSubscription(): Promise<any> {
    return {
      planName: 'Pro',
      price: '$199/month',
      renewalDate: 'July 15, 2026',
      status: 'active',
    };
  }

  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  async planHasFeature(
    planId: string,
    featureKey: string,
  ): Promise<boolean> {
    const feature = await this.planFeatureRepository.findOne({
      where: {
        planId,
        featureKey,
      },
    });
    return !!feature;
  }
}

import { Request, Response } from 'express';

export class ClinicController {
  public static getStats(req: Request, res: Response) {
    res.json({
      total_clinics: 12,
      active_therapists: 45,
      sessions_today: 128,
      availability_score: 0.94,
      provider: 'Symfony-Mock-Service'
    });
  }

  public static getClinics(req: Request, res: Response) {
    res.json([
      { id: 1, name: 'Serenity Central', region: 'London' },
      { id: 2, name: 'Neural North', region: 'Manchester' },
      { id: 3, name: 'Calm Coast', region: 'Brighton' }
    ]);
  }
}

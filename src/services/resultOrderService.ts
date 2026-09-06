import { ref, update } from 'firebase/database';
import { db } from '../config/firebase';
import { Program } from '../types';

export const resultOrderService = {
  async getPublicationOrder(festId: string, programs: Program[]): Promise<Record<string, number>> {
    const published = programs.filter(p => p.status === 'COMPLETED' && p.isResultPublished);
    const order: Record<string, number> = {};

    published.forEach(p => {
      if (typeof p.resultPublishedOrder === 'number' && p.resultPublishedOrder > 0) {
        order[p.id] = p.resultPublishedOrder;
      }
    });

    const missing = published.filter(p => !order[p.id]);
    const used = new Set(Object.values(order));
    let next = used.size ? Math.max(...used) + 1 : 1;

    for (const program of missing) {
      while (used.has(next)) next++;
      order[program.id] = next;
      used.add(next);
      next++;
    }

    if (missing.length > 0) {
      const writes: Record<string, number> = {};
      missing.forEach(p => {
        writes[`fests/${festId}/programs/${p.id}/resultPublishedOrder`] = order[p.id];
      });
      await update(ref(db), writes);
    }

    return order;
  },

  async getNextPublicationOrder(festId: string, programs: Program[]): Promise<number> {
    const order = await this.getPublicationOrder(festId, programs);
    const values = Object.values(order);
    return values.length ? Math.max(...values) + 1 : 1;
  }
};

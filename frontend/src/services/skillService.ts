import api from './api';

/** Tu dien ky nang AI worker nhan dien duoc. Rong = worker chua dong bo lan nao. */
export const getSkillDictionary = async (): Promise<string[]> =>
  (await api.get('/skills')).data.skills;

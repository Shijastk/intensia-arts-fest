// UI-only flags derived from the verified Firebase session (set by App). They decide which
// controls are shown; they grant nothing, because the database rules enforce every action.
let superAdminUi = false;

export const setSuperAdminUi = (value: boolean) => { superAdminUi = value; };
export const isSuperAdminUi = () => superAdminUi;

import { localDateISO, localMinutesNow } from "@/lib/utils";
import { getActiveFamilyId } from "@/lib/family/active";
function clock() {
  return { localDate: localDateISO(), localMinutes: localMinutesNow() };
}
function clockFamily() {
  const familyId = getActiveFamilyId();
  return familyId ? { ...clock(), familyId } : clock();
}
export {
  clock,
  clockFamily
};

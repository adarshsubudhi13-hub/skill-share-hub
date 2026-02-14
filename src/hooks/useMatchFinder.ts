import { useMemo } from "react";
import { Profile } from "./useProfile";
import { Match } from "./useMatches";

export interface PotentialMatch {
  profile: Profile;
  mySkillTheyWant: string[];
  theirSkillIWant: string[];
}

export function useMatchFinder(
  myProfile: Profile | null | undefined,
  allProfiles: Profile[] | undefined,
  matches: Match[] | undefined
): PotentialMatch[] {
  return useMemo(() => {
    if (!myProfile || !allProfiles) return [];

    const normalize = (s: string) => {
      if (!s) return "";
      return s.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/programming/g, 'programing'); // Keep this for backward compatibility with user data, but improved
    };

    const myId = myProfile.user_id;
    const myWanted = (myProfile.skills_wanted || []).map(normalize);
    const completedSwaps = matches?.filter(m => m.status === 'completed') || [];

    return allProfiles
      .filter((p) => p.user_id !== myId)
      .map((p) => {
        const theirId = p.user_id;
        const theirOffered = p.skills_offered.map(normalize);
        const theirWanted = p.skills_wanted.map(normalize);

        // Skills I offer that they want AND haven't been completed yet
        const mySkillTheyWant = (myProfile.skills_offered || []).filter((s) => {
          const normS = normalize(s);
          if (!normS) return false;

          // Fuzzy check: Does any skill they want include what I offer, or vice versa?
          const matchFound = theirWanted.some(tw => tw.includes(normS) || normS.includes(tw));
          if (!matchFound) return false;

          // Check if this specific skill has already been taught by ME to THEM
          const alreadyTaught = completedSwaps.some(m => {
            const isMeRequester = m.requester_id === myId && m.matched_user_id === theirId;
            const isMeMatched = m.matched_user_id === myId && m.requester_id === theirId;
            if (!isMeRequester && !isMeMatched) return false;
            const matchS = normalize(isMeRequester ? m.skill_offered : m.skill_requested);
            return matchS.includes(normS) || normS.includes(matchS);
          });

          return !alreadyTaught;
        });

        // Skills they offer that I want AND haven't been completed yet
        const theirSkillIWant = (p.skills_offered || []).filter((s) => {
          const normS = normalize(s);
          if (!normS) return false;

          // Fuzzy check: Does any skill I want include what they offer?
          const matchFound = myWanted.some(mw => mw.includes(normS) || normS.includes(mw));
          if (!matchFound) return false;

          // Check if this specific skill has already been taught by THEM to ME
          const alreadyLearned = completedSwaps.some(m => {
            const isMeRequester = m.requester_id === myId && m.matched_user_id === theirId;
            const isMeMatched = m.matched_user_id === myId && m.requester_id === theirId;
            if (!isMeRequester && !isMeMatched) return false;
            const matchS = normalize(isMeRequester ? m.skill_requested : m.skill_offered);
            return matchS.includes(normS) || normS.includes(matchS);
          });

          return !alreadyLearned;
        });

        return { profile: p, mySkillTheyWant, theirSkillIWant };
      })
      .filter((m) => m.mySkillTheyWant.length > 0 || m.theirSkillIWant.length > 0);
  }, [myProfile, allProfiles, matches]);
}

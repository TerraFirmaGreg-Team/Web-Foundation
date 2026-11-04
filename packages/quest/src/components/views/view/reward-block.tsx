'use client';

import { rewardDisplayTitle } from '@terrafirmagreg-team/quest/lib/display';
import type { QuestReward } from '@terrafirmagreg-team/quest/lib/data/dto';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';

export function RewardBlock({
  langMap,
  reward,
}: {
  langMap: Record<string, string>;
  reward: QuestReward;
}) {
  return (
    <>
      {reward.items.length ? (
        reward.items.map((id) => (
          <Entry
            key={id}
            id={id}
            kind={id.startsWith('#') ? 'itemTag' : 'item'}
            size="lg"
            variant="chip"
            missing="item"
          />
        ))
      ) : (
        <span className="text-sm">{rewardDisplayTitle(reward, langMap)}</span>
      )}
    </>
  );
}


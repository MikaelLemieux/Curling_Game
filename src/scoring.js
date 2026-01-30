import { distance } from "./utils.js";

export const calculateScore = (stones, houseCenter, houseRadius) => {
  const inHouse = stones.filter(
    (stone) => stone.inPlay && distance(stone.position, houseCenter) <= houseRadius
  );
  if (inHouse.length === 0) {
    return { team: null, points: 0 };
  }
  const sorted = [...inHouse].sort(
    (a, b) => distance(a.position, houseCenter) - distance(b.position, houseCenter)
  );
  const leadingTeam = sorted[0].team;
  const opponent = sorted.find((stone) => stone.team !== leadingTeam);
  const opponentDist = opponent ? distance(opponent.position, houseCenter) : Infinity;

  const points = sorted.filter(
    (stone) => stone.team === leadingTeam && distance(stone.position, houseCenter) < opponentDist
  ).length;

  return { team: leadingTeam, points };
};

export interface Trainer {
    id: string;
    name: string;
    region: string;
    class: string; // Gym Leader, Champion, Rival
    team: number[]; // Porter IDs
    imageUrl?: string; // Optional, might use a generic trainer sprite style or specific assets if available
}

export const TRAINERS: Trainer[] = [
    // Kanto
    { id: 'brock', name: 'Brock', region: 'Kanto', class: 'Gym Leader', team: [74, 95] }, // Geodude, Onix
    { id: 'misty', name: 'Misty', region: 'Kanto', class: 'Gym Leader', team: [120, 121] }, // Staryu, Starmie
    { id: 'ltsurge', name: 'Lt. Surge', region: 'Kanto', class: 'Gym Leader', team: [100, 25, 26] }, // Voltorb, Pikachu, Raichu
    { id: 'erika', name: 'Erika', region: 'Kanto', class: 'Gym Leader', team: [71, 114, 45] }, // Victreebel, Tangela, Vileplume
    { id: 'giovanni', name: 'Giovanni', region: 'Kanto', class: 'Gym Leader', team: [111, 112, 53, 34, 31] }, // Rhyhorn, Rhydon, Persian, Nidoking, Nidoqueen
    { id: 'blue', name: 'Blue', region: 'Kanto', class: 'Champion', team: [18, 103, 65, 112, 130, 6] }, // Pidgeot, Exeggutor, Alakazam, Rhydon, Gyarados, Charizard (Mixed)

    // Johto
    { id: 'whitney', name: 'Whitney', region: 'Johto', class: 'Gym Leader', team: [35, 241] }, // Clefairy, Miltank
    { id: 'red', name: 'Red', region: 'Johto', class: 'Champion', team: [25, 143, 6, 3, 9, 131] }, // Pikachu, Snorlax, Charizard, Venusaur, Blastoise, Lapras

    // Hoenn
    { id: 'steven', name: 'Steven Stone', region: 'Hoenn', class: 'Champion', team: [227, 306, 344, 348, 297, 376] }, // Skarmory, Aggron, Claydol, Armaldo, Hariyama (Wait, metagross is 376)
    { id: 'cynthia', name: 'Cynthia', region: 'Sinnoh', class: 'Champion', team: [442, 448, 407, 468, 445, 449] }, // Spiritomb, Lucario, Roserade, Togekiss, Garchomp, Milotic (Garchomp is 445)

    // Unova
    { id: 'n', name: 'N', region: 'Unova', class: 'Rival', team: [643, 567, 565, 560, 559, 584] }, // Reshiram/Zekrom etc. (Variables)

    // Kalos
    { id: 'diantha', name: 'Diantha', region: 'Kalos', class: 'Champion', team: [701, 699, 697, 706, 715, 282] }, // Hawlucha, Aurorus, Tyrantrum, Goodra, Gourgeist, Gardevoir

    // Galar
    { id: 'leon', name: 'Leon', region: 'Galar', class: 'Champion', team: [681, 778, 612, 534, 815, 6] }, // Aegislash, Dragapult, Haxorus, Seismitoad, Cinderace/Rillaboom/Inteleon... let's say Charizard logic.
];

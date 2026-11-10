// Profil avatarlarini (rasmlarni) bir marta yaratadi: public/avatars/*.svg va src/data/avatar-images.js
// Ishga tushirish: node scripts/gen-avatars.mjs  (faqat ro'yxatni o'zgartirganda kerak)
// Uslublar va litsenziyalar (https://www.dicebear.com/licenses/):
//   a- Lorelei — Lisa Wischofsky, CC0 1.0
//   c- Adventurer — Lisa Wischofsky, CC BY 4.0 (muallifni ko'rsatish shart — Mini App pastida)
//   d- Big Smile — Ashley Seo, CC BY 4.0 (muallifni ko'rsatish shart — Mini App pastida)

import { mkdirSync, writeFileSync } from 'node:fs';
import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';
import * as adventurer from '@dicebear/adventurer';
import * as bigSmile from '@dicebear/big-smile';

const DARK = '2c1b18';
const BROWN = '4a312c';
const GRAY = 'c4c4c4';
const SKIN = ['f2d3b1', 'ecad80'];

const L = (hair, color, extra = {}) => ({
  style: lorelei,
  opts: { hair: [`variant${hair}`], hairColor: [color], skinColor: ['f6dcc8'], beardProbability: 0, glassesProbability: 0, earringsProbability: 0, hairAccessoriesProbability: 0, frecklesProbability: 0, ...extra },
});
const C = (hair, color, skin, extra = {}) => ({
  style: adventurer,
  opts: { hair: [hair], hairColor: [color], skinColor: [skin], featuresProbability: 0, glassesProbability: 0, earringsProbability: 0, ...extra },
});
const D = (hair, color, skin, extra = {}) => ({
  style: bigSmile,
  opts: { hair: [hair], hairColor: [color], skinColor: [skin], accessoriesProbability: 0, ...extra },
});

// kind: man | woman | grandpa | grandma | boy | girl
export const LIST = [
  ['c-man1', 'man', C('short01', DARK, SKIN[0])],
  ['c-man2', 'man', C('short06', DARK, SKIN[1])],
  ['c-man3', 'man', C('short10', BROWN, SKIN[0])],
  ['c-man4', 'man', C('short14', DARK, SKIN[1], { glasses: ['variant02'], glassesProbability: 100 })],
  ['c-woman1', 'woman', C('long05', DARK, SKIN[0])],
  ['c-woman2', 'woman', C('long06', BROWN, SKIN[1])],
  ['c-woman3', 'woman', C('long21', DARK, SKIN[0])],
  ['c-woman4', 'woman', C('long26', DARK, SKIN[1], { earringsProbability: 100 })],
  ['c-grandpa', 'grandpa', C('short19', GRAY, SKIN[1], { features: ['mustache'], featuresProbability: 100 })],
  ['c-grandma', 'grandma', C('long07', GRAY, SKIN[0], { glasses: ['variant02'], glassesProbability: 100 })],
  ['c-boy', 'boy', C('short15', DARK, SKIN[0], { features: ['blush'], featuresProbability: 100 })],
  ['c-girl', 'girl', C('long15', DARK, SKIN[0], { features: ['blush'], featuresProbability: 100 })],
  ['c-girl2', 'girl', C('long14', BROWN, SKIN[1])],

  ['a-man1', 'man', L('01', DARK)],
  ['a-man2', 'man', L('03', BROWN)],
  ['a-man3', 'man', L('08', DARK, { beard: ['variant01'], beardProbability: 100 })],
  ['a-woman1', 'woman', L('15', DARK)],
  ['a-woman2', 'woman', L('19', BROWN)],
  ['a-woman3', 'woman', L('23', DARK)],
  ['a-grandpa', 'grandpa', L('25', GRAY, { beard: ['variant02'], beardProbability: 100 })],
  ['a-grandma', 'grandma', L('13', GRAY, { glasses: ['variant01'], glassesProbability: 100 })],
  ['a-girl', 'girl', L('26', DARK)],

  ['d-man1', 'man', D('shortHair', DARK, 'efcc9f')],
  ['d-man2', 'man', D('bowlCutHair', DARK, 'f5d7b1')],
  ['d-woman1', 'woman', D('wavyBob', DARK, 'efcc9f')],
  ['d-woman2', 'woman', D('straightHair', BROWN, 'f5d7b1')],
  ['d-woman3', 'woman', D('bunHair', DARK, 'e2ba87')],
  ['d-grandpa', 'grandpa', D('mohawk', GRAY, 'e2ba87')],
  ['d-grandma', 'grandma', D('curlyBob', GRAY, 'efcc9f')],
  ['d-boy', 'boy', D('curlyShortHair', DARK, 'f5d7b1')],
  ['d-girl', 'girl', D('braids', DARK, 'efcc9f')],
];

const out = new URL('../public/avatars/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [id, , { style, opts }] of LIST) {
  writeFileSync(new URL(`${id}.svg`, out), createAvatar(style, { seed: id, ...opts }).toString());
}
writeFileSync(
  new URL('LICENSE.txt', out),
  `Avatars generated with DiceBear (https://www.dicebear.com), not modified.
a-*: "Lorelei" by Lisa Wischofsky — CC0 1.0
c-*: "Adventurer" by Lisa Wischofsky — CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
d-*: "Big Smile" by Ashley Seo — CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
`,
);
writeFileSync(
  new URL('../src/data/avatar-images.js', import.meta.url),
  `// Avtomatik yaratilgan: node scripts/gen-avatars.mjs — qo'lda o'zgartirmang.
// Rasmlar: public/avatars/<id>.svg. Litsenziya: public/avatars/LICENSE.txt
export const AVATAR_IMAGES = ${JSON.stringify(LIST.map(([id, kind]) => ({ id, kind })), null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};
`,
);
console.log(`${LIST.length} ta avatar yaratildi`);

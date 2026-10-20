// English presentation of preserved interaction content. Original scene data is untouched.
const entries=[
 ['Señalización','Trail sign','Follow the paved paths and use the minimap to explore the shrine and mountain. Open Checkpoints in the menu to choose a destination.'],
 ['Temizuya','Temizuya · purification pavilion','A water basin with bamboo ladles used for ritual purification before visiting the shrine.'],
 ['Kagura-den','Kagura-den · sacred dance pavilion','A ceremonial stage with a patinated copper roof and gold ornament, associated with Kagura dance and music.'],
 ['Juyosho','Juyosho · amulets and ema','The shrine office for omamori amulets and votive ema plaques, near the approach to Senbon Torii.'],
 ['Estación JR','JR Inari Station','JR Inari Station faces the approach to the shrine. The preserved scene includes its vermilion columns.'],
 ['Shagōhyō','Shagōhyō and Ichiban Torii','The granite name pillar and first large torii mark the Omotesando approach.'],
 ['Saikan','Saikan and Shamusho','Ceremonial and administrative buildings represented in the original precinct scene.'],
 ['Inari Saryō','Inari Saryō','A tea-house setting with seating along the approach, inspired by the food and rest stops around the shrine.'],
 ['Nezameya','Nezameya','A restaurant setting on the shrine approach, associated with inari sushi, grilled eel and kitsune udon.'],
 ['Artesanías','Fushimi Ningyō crafts','Clay dolls, hand-painted fox masks and small votive torii represented in the original shop setting.'],
 ['Tsujiura','Tsujiura Senbei','A traditional confectionery setting with fox-shaped crackers and fortune sweets.'],
 ['Mapa Oficial','Shrine and mountain map','The pilgrimage leads from the lower precinct through Senbon Torii and Okusha, past Shin-ike and Yotsutsuji, and around the three summits.'],
 ['Nai-haiden','Naihaiden and Honden','The prayer front of the main sanctuary, with hanging lanterns and an offering chest.'],
 ['Gonden','Gonden · temporary sanctuary','A sanctuary used to house the deities during restoration of the main hall. The original scene preserves its cypress-bark roof treatment.'],
 ['Chōja-sha','Chōja-sha and Kada-sha','Subsidiary shrines represented beside the main sanctuary.'],
 ['Gosha-aiden','Gosha-aiden and Ryōgū-sha','Subsidiary shrine buildings along the approach toward Mount Inari.'],
 ['Shinme-sha','Shinme-sha · sacred horse pavilion','The original scene depicts a sacred white horse with decorative harness and paper streamers.'],
 ['Tamayama','Tamayama Inari-sha','A subsidiary shrine near the stairs behind Honden toward Okumiya and Senbon Torii.'],
 ['Okumiya','Okumiya · inner shrine','The upper-precinct shrine near Senbon Torii, represented with latticework, hanging lamps and a bark-textured roof.'],
 ['Byakko-sha','Byakko-sha · white fox shrine','A shrine associated with the sacred white fox messengers of Inari, beside Okumiya.'],
 ['Piedra de la Bifurcación','Senbon Torii fork marker','The stone marker stands between the two parallel torii corridors leading toward Okusha.'],
 ['Okusha Hōhaisho','Okusha Hōhaisho','The worship pavilion beyond the twin Senbon Torii corridors, facing the sacred mountain.'],
 ['Kitsune Ema','Kitsune ema · fox plaques','Fox-shaped wooden plaques where visitors draw faces and write wishes.'],
 ['Omokaru-ishi','Omokaru-ishi · heavy-light stones','Tradition invites visitors to make a wish and lift a stone: its perceived weight is interpreted as a sign of the effort needed.'],
 ['Kumataka','Kumataka-sha and Shin-ike','The lakeside shrine setting preserves vermilion rails and candle cabinets beside Shin-ike.'],
 ['Chaya de Yotsutsuji','Yotsutsuji tea houses','A resting place at the trail junction, with red-covered benches and views across Kyoto.'],
 ['Mirador','Kyoto viewpoint','The westward outlook faces the Kyoto basin and the distant western mountains.'],
 ['Take-ya','Take-ya tea-house setting','A small mountain rest stop represented among bamboo in the original scene.'],
 ['Matsunokura','Matsunokura tea-house setting','A tea and rest stop represented on the mountain ascent.'],
 ['Yakikoma','Upper-trail tea-house setting','A traditional tea-house setting preserved from the original upper-mountain scene.'],
 ['Gozen-dani','Gozendani Hōhaisho','A worship area in the northern valley associated with offerings for the sacred summits.'],
 ['Sannomine','Sannomine · third summit','The preserved sanctuary includes a dark wooden pavilion, vermilion lanterns, a ceremonial curtain and stepped stone altars.'],
 ['Ninomine','Ninomine · second summit','A summit shrine approached by stone stairs and lanterns, with a hanging bell at the prayer front.'],
 ['Mitsurugi','Mitsurugi-sha · sword stone','The shrine is associated with Tsurugiishi, the sword stone, and the swordsmith story told in the Noh play Kokaji.'],
 ['Cumbre','Ichinomine · highest summit','The summit shrine setting preserves stone stairs, a wooden pavilion, a ceremonial curtain, a bell rope, candles and surrounding otsuka altars.']
];
export function englishInteraction(data){
 const entry=entries.find(([key])=>data.title.includes(key));
 if(entry)return {title:entry[1],description:entry[2]};
 return {title:'Otsuka · votive altar',description:'Stone votive altars beside the mountain trail, with miniature vermilion torii and candle offerings.'};
}

// Original commemorative illustrations, not reproductions of official goshuin.
// Static SVG strokes need no image download, canvas upload or animated filter.
const motifs=[
 `<path d="M47 96V67q0-15 15-15h36q15 0 15 15v29H47Zm4-21h58M80 54v22M56 86h9m30 0h9M58 97l-9 13m52-13 10 13M46 112h68M54 103h52"/><path d="M66 47h28M73 42h14M38 71V55m0 5h5m77 11V55m0 5h-5"/>`,
 `<path d="M36 56q44 10 88 0m-84 4 3 7h74l3-7M43 73h74M51 68l-5 43m63-43 5 43M79 68v10M44 111h15m42 0h15M61 77h38m-32 0-2 29m28-29 2 29M70 84h20m-17 4-1 16m16-16 1 16M62 113l36-7m-35 12 35-6"/>`,
 `<path d="M34 111q19-8 34-3t27-2 30 3M40 99l12-20 11 20m-18-8h13M104 101l12-25 11 25m-18-11h13M54 106V91m62 15V91M76 110V61q-20 1-20 18 15 2 20-9m0 9q21-17 29-2-4 18-27 18M76 66q-9-22 5-27 15 14-2 27M70 119l20-8m-24 13 32-8"/>`,
 `<path d="M32 95q18-16 32-9t28-5 36 8M35 106h91M43 103V88h5v15m6 0V81h6v22m6 0V92h5v11m6 0V74h6v29m5 0V87h4v16m6 0V79h6v24m6 0V91h7v12M35 114q44-10 90-1M47 119q30-6 65-1"/><circle cx="105" cy="57" r="10"/><path d="m33 78 19-16 19 15 14-9 21 12"/>`,
 `<path d="m31 110 30-43 15 16 19-35 34 62H31Zm21-13 10-16 9 11m11-14 13-17 10 20M43 116h72M53 122h54M78 109V94m-9 4h20M91 92l-2 17m-17-17-2 17M64 93q15 4 32 0"/><path d="m101 42 5-5m5 13 8-2m-26-9v-7"/>`
];
const labels=['DEPARTURE','THE GATES','FOREST','KYOTO','SUMMIT'];
export function journeySeal(index){
 if(!Number.isInteger(index)||index<0||index>=motifs.length)throw new RangeError('Unknown journal seal');
 const round=index===4;
 const border=round?'<path d="M80 12c36 0 66 30 66 67s-29 68-66 68S13 117 13 80 43 12 80 12Z"/><circle cx="80" cy="80" r="60"/>':'<path d="m17 15 126 2 2 126-128 2-2-122m8 3 115-2 1 113-114 2Z"/>';
 const wear=Array.from({length:13},(_,i)=>{const x=25+(i*31)%109,y=24+(i*47)%111;return `<path d="m${x} ${y} 2 -1" opacity=".28"/>`;}).join('');
 return `<svg viewBox="0 0 160 160" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${border}<g stroke-width="2.4">${motifs[index]}</g>${wear}<text x="80" y="36" text-anchor="middle" fill="currentColor" stroke="none" style="font:9px Georgia,serif;letter-spacing:2px">INARIYAMA</text><text x="80" y="135" text-anchor="middle" fill="currentColor" stroke="none" style="font:8px Georgia,serif;letter-spacing:1.6px">${labels[index]}</text></svg>`;
}

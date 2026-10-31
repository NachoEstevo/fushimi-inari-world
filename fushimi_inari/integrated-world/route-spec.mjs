// Meters. OSM dimensions/counts are dated survey claims; other dimensions remain
// inferred from photographs and comparable wooden Inari torii, not a laser survey.
export const routeSpec = {
  revision: 8,
  senbon: {
    // First three gates: photographic estimates, not measured 5-go dimensions.
    entrancePillarDiameters: [.21,.195,.18],
    entranceSource:'Basile Morin, 2019-06-10, Double torii path at Fushimi Inari Taisha Shrine (Commons); diameters inferred relative to inner gates',
    pillarDiameter: .15, pillarCenters: 1.82, height: 2.55,
    crossbarUnderside: 1.98, beamWidth: 2.95, blackBaseHeight: .46,
    spacing:{spacing:.57,minimum:.43,margin:.65},
    paths: [
      {id:'way/260121328', smallCount:382, largeCount:0},
      {id:'way/377968455', smallCount:396, largeCount:3}
    ],
    countSource:'OSM source=survey 2014-08-16; note tags',
    diameterSource:'Hasegawa workshop interview, 8984.jp/machi/2026/10/000650.html',
    otherDimensions:'5-go manufacturer comparison: 2.55 m kasagi height, 2.95 m width; opening and feet inferred from photographs, not a site survey',
  },
  stairs: {targetRise:.15, minimumTread:.28, provenance:'OSM steps and step_count; intermediate risers inferred from GSI DEM'},
  forest: {seed:20261020, nearSpacing:6.5, farSpacing:16, provenance:'Kyoto city documents shii/kashi evergreen forest. Broadleaf-dominant mix and individual positions inferred; legacy sugi and understory preserved.'}
};

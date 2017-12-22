var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	attributionControl: false,
	zoomControl: true,
	srs: 3857,
	scrollWheelZoom: true,
	center: new L.LatLng(45.47987347203981, 42.03712463378906),
	zoom: 10
});
L.gmx.loadMap('F4BEA507CF0A416081C21300AF0AD68A', {leafletMap: map, srs: 3857});
var blm = map.gmxBaseLayersManager;
blm.initDefaults({srs: 3857}).then(function() {
	var baseLayers = blm.getAll().map(function(baseLayer) { return baseLayer.id; });
	var satellite = blm.get('satellite'),
		sat1 = L.tileLayer('//maps.kosmosnimki.ru/TileService.ashx?request=getTile&map=PLDYO&LayerName=63E083C0916F4414A2F6B78242F56CA6&z={z}&x={x}&y={y}&ftc=osm&srs=3857&apikey=AYU65737MA'),
		slope = blm.get('slope');
	L.control.iconLayers([
		{
			title: satellite.options.rus,
			icon: satellite.options.icon,
			layer: sat1
		},
		{
			title: slope.options.rus,
			icon: slope.options.icon,
			layer: slope
		}
	], {}).addTo(map);
	blm.setActiveIDs(baseLayers).setCurrentID('satellite');

});

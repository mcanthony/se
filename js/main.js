//--------------------- audio global vars ----------------------//
window.AudioContext = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext);
var context = new AudioContext();
var analyser = context.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.7;
var filter = context.createBiquadFilter();
filter.type = 'highpass';
filter.frequency.value = 5000;
var audiosource = context.createBufferSource();
audiosource.connect(filter);
filter.connect(analyser);
audiosource.connect(context.destination);
var frequencyData = new Uint8Array(analyser.frequencyBinCount);
var isloaded = false;

//audio files
var audioElements = [];
//--------------------- three global vars ----------------------//
var renderer, scene, camera, controls;
var mesh = new THREE.Mesh(), geometry, material, texture;
var vertices =[], originalvertices = [];
var offset1, offset2, offset3;
var ambient = 0x000000, 
	diffuse = 0x000000, 
	specular = 0x000000, 
	shininess = 0.0,
	scale = 80;
var uniforms;
var vs, fs;

//--------------------- helper methods ----------------------//
var map = function(value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};
//--------------------- setup ----------------------//
function setup() {
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setClearColor(new THREE.Color('black'), 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 400;

	controls = new THREE.OrbitControls(camera);
	controls.minDistance = 200;
	controls.maxDistance = 700;
	controls.noKeys = true;
	controls.maxPolarAngle = 2.2;
	controls.minPolarAngle = 0.8;
	controls.maxAzimuthAngle = 1.2;
	controls.minAzimuthAngle = -1.2;
	controls.noPan = true;
	controls.autoRotate = false;
	controls.autoRotateSpeed = 0.25;
	controls.zoomSpeed = 0.15;
	controls.rotateUp(-0.2);
	controls.rotateLeft(-0.2);

	geometry = new THREE.PlaneBufferGeometry(200,200,90,90);
    geometry.dynamic = true;
	geometry.computeTangents();

	var manager = new THREE.LoadingManager();
	var loader = new THREE.XHRLoader(manager);
    var audioLoader = new THREE.XHRLoader(manager);

	loader.load('shaders/vs.glsl', function(e){
		vs = e;
	});

	loader.load('shaders/fs.glsl', function(e){
		fs = e;
	});

    audioLoader.setResponseType("arraybuffer");
    audioLoader.load("audio/1.mp3",function(e){
        context.decodeAudioData(e, function(buffer){
           audiosource.buffer = buffer;
           audiosource.start(0);
        });
    });

	texture = new THREE.ImageUtils.loadTexture('images/3.png');

	var shader = THREE.ShaderLib.normalmap;
	uniforms = THREE.UniformsUtils.clone(shader.uniforms);
	uniforms[ "enableDisplacement" ].value = true;
    uniforms[ "enableDiffuse" ].value = 0;
    uniforms[ "tDiffuse" ].value = texture;
    uniforms[ "tDiffuseOpacity" ] = { type: 'f', value: 1.0 };
    uniforms[ "tDisplacement" ] = { type: 't', value: texture};
    uniforms[ "uDisplacementScale" ].value = 100;
    uniforms[ "ambientLightColor" ].value = new THREE.Color( ambient );
    uniforms[ "uDisplacementPostScale" ] = {type: 'f', value: scale };
    uniforms[ "diffuse" ].value = new THREE.Color( diffuse );
    uniforms[ "specular" ].value = new THREE.Color( specular );
    uniforms[ "ambient" ].value = new THREE.Color( ambient );
    uniforms[ "shininess" ].value = shininess;

	manager.onLoad = function(){
		material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vs,
            fragmentShader: fs,
            side: THREE.DoubleSide,
            wireframe: true
    	});
		mesh = new THREE.Mesh(geometry, material);

        vertices = mesh.geometry.getAttribute("position").array;
        for(var i = 0; i < vertices.length; i++){
            originalvertices.push(vertices[i]);
        }

        offset1 = Math.ceil(vertices.length / 8);
        offset2 = Math.ceil(vertices.length / 1.9);
        offset3 = Math.ceil(vertices.length / 2.5);

        isloaded = true;
		scene.add(mesh);
	};
}
//--------------------- drawing methods ----------------------//
function analyseAudio(){
	analyser.getByteFrequencyData(frequencyData);
}

function autoRotate(){
    var time = Date.now();
    var value = Math.sin(time * 0.00009) * 0.4;
    mesh.rotation.y = value;
}

function updateVertices(){

	if(isloaded) {
        var sum = 0;
        for(var i = 0; i < frequencyData.length; i++){
            sum += frequencyData[i];
            var index = Math.ceil(map(i, 0, frequencyData.length, 0, vertices.length));
            var value = map(frequencyData[i], 0, 256, 1, 1.3);
            vertices[index + offset1 + 200] = originalvertices[index + offset1 + 200] * value;
            vertices[index + offset2 + 200] = originalvertices[index + offset2 + 200] * value;
            vertices[index + offset3] = originalvertices[index + offset3] * value;
        }
        var average = sum/frequencyData.length;
        if( average > 20) {
            scale = average + 80;
        }
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    }
}
//--------------------- event listeners ----------------------//
function setupListeners(){
	window.addEventListener('resize', function(){
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect	= window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();	
	}, false);
}

function loadAudio(){
    var id = '?client_id=c625af85886c1a833e8fe3d740af753c'
    var iter = 0;
    var senoghte = new Audio();
    senoghte.src = 'https://api.soundcloud.com/tracks/182234545/stream' + id;
    var sedandeh = new Audio();
    sedandeh.src = 'https://api.soundcloud.com/tracks/182234545/stream' + id;
    var saboon = new Audio();
    saboon.src = 'https://api.soundcloud.com/tracks/182234545/stream' + id;
    audioElements.push(senoghte, sedandeh, saboon);
    for(var i in audioElements){
        audioElements[i].addEventListener('canplaythrough', function(){
            iter++
            if(iter === 3){
                console.log('Audio Files Can Play Through');
            }
        });
    }
}

//--------------------- draw ----------------------//
function draw() {
	analyseAudio();
	updateVertices();
	controls.update();
    autoRotate();
	uniforms[ "uDisplacementPostScale" ].value = scale;
	renderer.render(scene, camera);
	requestAnimationFrame(draw);
}

window.onload = function() {
	setup();
	setupListeners();
    loadAudio();
	draw();
};
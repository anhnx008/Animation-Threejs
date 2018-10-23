//Define color palette
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    brownDark: 0x23190f,
    pink: 0xF5986E,
    yellow: 0xf4ce93,
    blue: 0x68c3c0,
    black: 0x000000, 
}

//--------------------Define createScene() function---------------------------

var scene, camera, renderer, fieldOfView, aspectRation, nearPlane, farPlane, HEIGHT, WIDTH, container
function createScene() {

    //******CREATE SCENE ******/
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    //scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    //******CREATE CAMERA *****/
    //For perspective camera we need PerspectiveCamera(fieldOfView, aspectRatio, near, far)

    //Get the width and height of the screen,
    //use them to setup aspect ratio of the camera and the size of the renderer
    //Aspect ratio is the ration of width to height
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    fieldOfView = 60; //in degrees
    aspectRatio = WIDTH / HEIGHT;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

    //Set the position of the camera
    camera.position.x = 0;
    camera.position.y = 200;
    camera.position.z = 500;


    //**** */*CREATE RENDERER *****/
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    //Define the size of the renderer; in this case it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    //Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Attach the renderer to the container div in the html
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

//As the screen size change, the renderer's size and the camera's aspect ration will need to update
//This function will update the height and width of the renderer and the camera
function handleWindowResize() {

    //Get the new width and height of the screen
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    //Resize the renderer and update the camera's aspect ratio
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix(); //This is called when properties of camera are changed

}

//--------------------Define createLight() function---------------------------

var hemisphereLight, shadowLight;
function createLights() {
    //A hemisphere light is a gradient colored light;
    //the 1st parameter is sky color, 2nd parameter is the ground color, 3rd is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

    //A directional light shines from a specific direction.
    //It acts like the sun, all rays produced are parellel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    //Set direction of the directional light
    shadowLight.position.set(150, 350, 350);

    //Allow shadow casting 
    shadowLight.castShadow = true;

    //Define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    //Define the resolution of the shadow; the higher the better, 
    //but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //To activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}


//--------------------Define createSea() function---------------------------
var sea;
//Create a sea constructor (sea object)- the sea will be a blue cylinder placed at the bottom of the screen
Sea = function () {

    //Create a cylinder
    //radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new THREE.CylinderGeometry(700, 600, 800, 40, 10);

    //Rotate the geometry on the x-axis
    //Common use of the Matrix4 is for 3D transformation
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2)); //Takes in a rotation angle in radians (90 degs in this case)

    //Creating waves
    //Important: by merging vertices we ensure the continuity of the waves
    geom.mergeVertices();

    //Get total number of vertices in the cylinder object
    var length = geom.vertices.length;

    //Create an array to store a new data associated to each vertex
    this.waves = [];

    for(var i =0; i < length; i++){

        //Get each vertex
        var vertex = geom.vertices[i];

        //Store some data associated to it
        this.waves.push({
            x: vertex.x,
            y: vertex.y,
            z: vertex.z,
            //Set a random angle
            angle: Math.random()*Math.PI*2,
            //Set a random amplitude
            amplitude: 5 + Math.random()*15,
            //Set a random speed b/t 0.016 and 0.048 radians / frame
            speed: 0.016 + Math.random()*0.032,
        });
    };

    //Create material for the sea
    var material = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading,
    });

    //To create an object in Three.js we need to create a mesh
    //A mesh is a combination of the geometry and material
    this.mesh = new THREE.Mesh(geom, material);

    //Allow the sea to receive shadows
    this.mesh.receiveShadow = true;
}

//Now we create the function that will be called in each frame 
//to update the position of the vertices to simulate the waves
Sea.prototype.moveWaves = function (){
    
    //Get the vertices
	var verts = this.mesh.geometry.vertices;
	var l = verts.length;
	
	for (var i=0; i<l; i++){
		var v = verts[i];
		
		//Get the data associated to it
		var vprops = this.waves[i];
		
		// update the position of the vertex
		v.x = vprops.x + Math.cos(vprops.angle)*vprops.amplitude;
		v.y = vprops.y + Math.sin(vprops.angle)*vprops.amplitude;

		//Increment the angle for the next frame
		vprops.angle += vprops.speed;
	}

	// Tell the renderer that the geometry of the sea has changed.
	// In fact, in order to maintain the best level of performance, 
	// three.js caches the geometries and ignores any changes
	// unless we add this line
	this.mesh.geometry.verticesNeedUpdate=true;

	sea.mesh.rotation.z += .005;
}

//Instantiate the sea object and add it to the scene
function createSea() {
    sea = new Sea();

    //Move it to the bottom of the screen
    sea.mesh.position.y = -600;

    //Add the mesh of the sea to the scene
    scene.add(sea.mesh);
}


//--------------------Define createSky() function---------------------------

//Create a cloud constructor (cloud object) - the cloud is composed of several cubes/spheres of different size
Cloud = function () {

    //Create an empty container that will hold different parts of the cloud
    this.mesh = new THREE.Object3D();

    //Create a cube geometry
    //var geom = new THREE.BoxGeometry(7, 7, 7);
    var geom = new THREE.SphereGeometry(15, 8, 8);

    //Create material for the cloud
    var material = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent:true,
		opacity:.85,
    });

    //Duplicate the geometry a random number of times
    var nBlocs = 5 + Math.floor(Math.random() * 3);

    for (var i = 0; i < nBlocs; i++) {

        //Create the mesh by cloning the geometry
        //var newCube = new THREE.Mesh(geom, material);
        var newSphere = new THREE.Mesh(geom, material);

        //Set positions and the rotation of each cube randomly
        newSphere.position.x = i * 15;
        newSphere.position.y = Math.random() * 10;
        newSphere.position.z = Math.random() * 10;
        //newCube.rotation.z = Math.random() * Math.PI * 2;
        //newCube.position.y = Math.random() * Math.PI * 2;

        //Set the size of the cube randomly
        var newSphereSize = .5 + Math.random() * 2;
        newSphere.scale.set(newSphereSize, newSphereSize, newSphereSize);

        //Allow each cube to cast and receive shadows
        newSphere.castShadow = true;
        newSphere.receiveShadow = true;

        //Add the cube to the 3D container we first created
        this.mesh.add(newSphere);
    }
}

//Placing the new constructed clouds at random postions around the z-axis
//Create a sky constructor (sky object)
Sky = function () {

    //Create an empty container
    this.mesh = new THREE.Object3D();

    //Choose a number of clouds to be scattered in the sky
    this.nClouds = 20;

    // To distribute the clouds consistently, we need to place them according to a uniform angle
    var stepAngle = Math.PI * 2 / this.nClouds;

    //Create clouds
    for (var i = 0; i < this.nClouds; i++) {

        var cloud = new Cloud();

        //Set the rotation and the position of each cloud; for that we use a bit of trigonometry
        var angle = stepAngle * i; // this is the final angle of the cloud
        var height = 1300 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

        //Converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
        cloud.mesh.position.y = Math.sin(angle) * height;
        cloud.mesh.position.x = Math.cos(angle) * height;

        //Rotate the cloud according to its position
        cloud.mesh.rotation.z = angle + Math.PI / 2;

        // for a better result, we position the clouds 
        // at random depths inside of the scene
        cloud.mesh.position.z = -400 - Math.random() * 400;

        //Set random scale for each cloud
        var s = 1 + Math.random() * 2;
        cloud.mesh.scale.set(s, s, s);

        this.mesh.add(cloud.mesh);
    }
}

// Now we instantiate the sky and push its center a bit towards the bottom of the screen
var sky;
function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}


//-----------Define createPlane() function---------------------
var airplane;
var AirPlane = function () {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "airPlane";

    // Create the cabin
    var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });

    //Modify the back of the cockpit by changing its vertices
    //We can access a specific vertex of a shape through vertices array and then move its x,y,z property

    geomCockpit.vertices[4].y -= 5;
    geomCockpit.vertices[4].z += 5;
    geomCockpit.vertices[5].y -= 5;
    geomCockpit.vertices[5].z -= 5;
    geomCockpit.vertices[6].y += 5;
    geomCockpit.vertices[6].z += 5;
    geomCockpit.vertices[7].y += 5;
    geomCockpit.vertices[7].z -= 5;


    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create Engine
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create Tailplane
    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create Wing
    var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.position.set(0, 0, 0);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // Propeller
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // Blades
    var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });

    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    //Wheels
    var geomWheel = new THREE.CylinderGeometry(8,8,5);

    //Rotae the wheel on the x-axis
    geomWheel.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI/2));

    var matWheel = new THREE.MeshPhongMaterial({color: Colors.black});

    var wheel = new THREE.Mesh(geomWheel, matWheel);
    wheel.position.set(-20, -25, 0);

    wheel.castShadow = true;
    wheel.receiveShadow = true;
    this.mesh.add(wheel);
    
};

function createPlane() {
    airplane = new AirPlane();
    airplane.mesh.scale.set(1, 1, 1);
    airplane.mesh.position.y = 400;
    scene.add(airplane.mesh);
}

//Function to update plane position based on mouse position
function updatePlane() {

    //Set the airplane to move between -100 and 100 on the horizontal axis, 
    //and between 25 and 175 on the vertical axis,
    //depending on the mouse position which ranges between -1 and 1 on both axes;
    //to achieve that we use a normalize function (see below)

    var targetX = normalize(mousePos.x, -1, 1, -100, 100);
    var targetY = normalize(mousePos.y, -1, 1, 25, 275);

    //Update the airplane's position
    airplane.mesh.position.y = targetY;
    airplane.mesh.position.x = targetX;
    airplane.propeller.rotation.x += 0.3;
}

function normalize(v, vmin, vmax, tmin, tmax) {

    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}

function loop() {
    // Rotate the propeller, the sea and the sky
    airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.z += .005;
    sky.mesh.rotation.z += .01;

    //Update the plane on each frame 
    updatePlane();

    //Update the waves
    sea.moveWaves();

    //Render the scene
    renderer.render(scene, camera);

    //Call the loop function again
    requestAnimationFrame(loop);
}

//Structure of the init function (main function)
//Add in an event listener to see if the mouse is moving once document is loaded
function init(event) {

    //Setup scene, camera and renderer
    createScene();

    //Add lights
    createLights();

    //Add objects
    createPlane();
    createSea();
    createSky();

    //Add listener to for mouse movement
    document.addEventListener('mousemove', handleMouseMove, false);

    //Start a loop that will update the objects' postions and render the scene on each frame
    loop();
}

//Handle mouse movement
var mousePos = { x: 0, y: 0 }
function handleMouseMove(event) {
    //Here we are converting the mouse position value received 
    //to a normalized value varying between -1 and 1;
    //this is the formula for the horizontal axis:

    var tx = -1 + (event.clientX / WIDTH) * 2;

    //For the vertical axis, we need to inverse the formula 
    //because the 2D y-axis goes the opposite direction of the 3D y-axis

    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = { x: tx, y: ty };
}

window.addEventListener('load', init, false);

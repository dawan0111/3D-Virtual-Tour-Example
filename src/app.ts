import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { wayPoints } from "./fake";
import degree360Icon from "./assets/360.svg";
import Mouse from "./mouse";

export default class App {
  wayPoints: {
    id: number;
    x: number;
    z: number;
    image: string;
    material: THREE.MeshBasicMaterial;
  }[];
  renderer;
  camera;
  raycaster;
  clickMouse;
  cameraLat;
  cameraLon;
  scene;
  mesh;
  arrows: string[];
  activeId;

  mouse;
  pointerDownLon = 0;
  pointerDownLat = 0;

  x = 0;
  z = 0;

  constructor() {
    const container = document.getElementById("container") as HTMLElement;
    const geometry = new THREE.SphereGeometry(500, 120, 40);
    geometry.scale(-1, 1, 1);

    this.mouse = new Mouse(
      container,
      this.onPointerDown.bind(this),
      this.onPointerMove.bind(this),
      this.onPointerUp.bind(this)
    );
    this.activeId = 1;
    this.wayPoints = [];
    this.arrows = [];
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1100
    );
    this.cameraLat = -40;
    this.cameraLon = 0;
    this.scene = new THREE.Scene();
    this.mesh = new THREE.Mesh(geometry);
    this.raycaster = new THREE.Raycaster();
    this.clickMouse = { x: 0, y: 0 };
    this.assetInitial();

    container.appendChild(this.renderer.domElement);
    container.style.touchAction = "none";
    window.addEventListener("click", this.onArrowClick.bind(this));
    window.addEventListener("resize", this.onWindowResize.bind(this));

    this.scene.add(this.mesh);
    this.changeScreen(1);
    this.render();
  }

  assetInitial() {
    wayPoints.forEach((wayPoint) => {
      const texture = new THREE.TextureLoader().load(wayPoint.image);
      this.wayPoints.push({
        id: wayPoint.id,
        x: wayPoint.x,
        z: wayPoint.z,
        image: wayPoint.image,
        material: new THREE.MeshBasicMaterial({ map: texture }),
      });
    });
  }

  onArrowClick(event: MouseEvent) {
    // THREE RAYCASTER
    this.clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.clickMouse, this.camera);
    const found = this.raycaster.intersectObjects(this.scene.children);

    if (found.length > 0) {
      const arrowMesh = found.find(
        (mesh) => mesh.object.parent?.userData?.name == "ARROW"
      );
      if (arrowMesh) {
        const userData = arrowMesh.object.parent?.userData;
        console.log(userData);
        this.changeScreen(userData?.id);
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onPointerDown() {
    this.pointerDownLon = this.cameraLon;
    this.pointerDownLat = this.cameraLat;
  }

  onPointerMove(event: PointerEvent) {
    const { onPointerDownMouseX, onPointerDownMouseY } = this.mouse;
    this.cameraLon =
      (onPointerDownMouseX - event.clientX) * 0.1 + this.pointerDownLon;
    this.cameraLat =
      (event.clientY - onPointerDownMouseY) * 0.1 + this.pointerDownLat;
  }

  onPointerUp() {
    // TODO: Pointer up
  }

  changeScreen(screenId: number) {
    const wayPoint = this.wayPoints.find(
      (wayPoint) => wayPoint.id === screenId
    );
    if (wayPoint) {
      this.activeId = screenId;
      this.x = wayPoint.x;
      this.z = wayPoint.z;

      this.mesh.material = wayPoint.material;
      this.mesh.material.needsUpdate = true;

      this.setArrow();
      this.renderSidebar();
    }
  }

  setArrow() {
    const loader = new GLTFLoader();
    const delta = 40;

    this.arrows.forEach((arrow) => {
      const selectedObject = this.scene.getObjectByName(arrow);
      if (selectedObject) {
        this.scene.remove(selectedObject);
      }
    });

    for (let i = 0; i < this.wayPoints.length; i++) {
      if (this.wayPoints[i].x === this.x && this.wayPoints[i].z === this.z) {
        continue;
      }
      loader.load("/arrow.glb", (gltf) => {
        const x = this.wayPoints[i].x - this.x;
        const z = this.wayPoints[i].z - this.z;

        const radian = Math.atan2(x, z);
        const circle_z = delta * Math.cos(radian);
        const circle_x = delta * Math.sin(radian);

        gltf.scene.position.set(circle_z, -50, circle_x);
        gltf.scene.rotation.y = Math.PI - radian;

        gltf.scene.children[0].userData.id = this.wayPoints[i].id;
        gltf.scene.children[0].userData.name = "ARROW";
        gltf.scene.children[0].userData.x = x;
        gltf.scene.children[0].userData.y = z;

        this.arrows.push(gltf.scene.name);
        this.scene.add(gltf.scene);
      });
    }
  }

  renderSidebar() {
    const wayPointElement = this.wayPoints.map(
      (wayPoint) => `
      <div class="gallery-item ${
        wayPoint.id === this.activeId ? "active" : ""
      }" id="galleryItem${wayPoint.id}" data-id="${wayPoint.id}">
        <div class="icon"><img src="${degree360Icon}" alt="icon" /></div>
        <img src="${wayPoint.image}" alt="image" />
      </div>
    `
    );

    const galleryListElement = document.querySelector("#galleryList");
    if (galleryListElement) {
      galleryListElement.innerHTML = wayPointElement.join("");
      const galleryListElements = document.querySelectorAll(".gallery-item");
      galleryListElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.addEventListener("click", () => {
            this.changeScreen(Number(element.dataset.id));
          });
        }
      });
    }
  }

  render() {
    this.update();
    requestAnimationFrame(() => this.render());
  }

  update() {
    this.cameraLat = Math.max(-90, Math.min(90, this.cameraLat));
    const phi = THREE.MathUtils.degToRad(90 - this.cameraLat); // 위, 아래
    const theta = THREE.MathUtils.degToRad(this.cameraLon); // 좌, 우

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(x, y, z);
    this.renderer.render(this.scene, this.camera);
  }
}

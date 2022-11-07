export default class Mouse {
  isMove = false;
  isUserInteracting = false;
  onPointerDownMouseX = 0;
  onPointerDownMouseY = 0;
  onPointerDown_;
  onPointerMove_;
  onPointerUp_;

  constructor(
    element: HTMLElement,
    onPointerDown: (event: PointerEvent) => void,
    onPointerMove: (event: PointerEvent) => void,
    onPointerUp: (event: PointerEvent) => void
  ) {
    this.onPointerMove_ = onPointerMove;
    this.onPointerDown_ = onPointerDown;
    this.onPointerUp_ = onPointerUp;
    element.addEventListener("pointerdown", this.onPointerDown.bind(this));
    document.addEventListener("pointermove", this.onPointerMove.bind(this));
    document.addEventListener("pointerup", this.onPointerUp.bind(this));
  }

  onPointerDown(event: PointerEvent) {
    if (event.isPrimary === false) return;
    this.isMove = false;
    this.isUserInteracting = true;

    this.onPointerDownMouseX = event.clientX;
    this.onPointerDownMouseY = event.clientY;

    this.onPointerDown_ && this.onPointerDown_(event);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isUserInteracting) return;
    this.onPointerMove_ && this.onPointerMove_(event);
  }

  onPointerUp(event: PointerEvent) {
    this.isUserInteracting = false;
    this.onPointerUp_ && this.onPointerUp_(event);
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
  }
}

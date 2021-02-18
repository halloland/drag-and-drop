import {AfterViewInit, Directive, ElementRef, Input} from "@angular/core";
import {animate, AnimationBuilder, AnimationPlayer, keyframes, style} from "@angular/animations";
import {Subscription, timer} from "rxjs";

@Directive({
  selector: '[drag-item]'
})
export class DragItemDirective implements AfterViewInit {
  animating = false;
  currentX = 0;
  currentY = 0;
  initialX = 0;
  initialY = 0;
  backupX = 0;
  backupY = 0;
  isDragItem: boolean = false;

  private player: AnimationPlayer;

  constructor(public elementRef: ElementRef, private animationBuilder: AnimationBuilder) {

  }
  @Input() dragDisabled: boolean = false;

  ngAfterViewInit(): void {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    this.currentX = this.initialX = clientRect.x;
    this.currentY = this.initialY = clientRect.y;

   // this.moveToBox(100, 100);
  }

  moveToBox(x: number, y: number): void {
    this.animating = true;
    const styles = style({ transform: `translate(${x - this.initialX}px, ${y - this.initialY}px)`});
    this.backupX = x;
    this.backupY = y;

    const animationMetadata = animate(200 + "ms", styles);

    const animationFactory = this.animationBuilder.build(animationMetadata);
    this.player = animationFactory.create(this.elementRef.nativeElement);

    this.player.onDone(() => {
      this.animating = false;
      if (!this.isDragItem) {
        this.currentX = this.backupX;
        this.currentY = this.backupY;
      }
      console.log('aniumation end')
    })
    this.player.onDestroy(() => {
      console.log('destroyed');
    })

    this.player.play();
  }
}

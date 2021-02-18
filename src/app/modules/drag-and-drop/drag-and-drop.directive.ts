import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  QueryList,
  SimpleChanges
} from "@angular/core";
import {fromEvent, merge, Observable, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {DragAndDropOptions} from "./drag-and-drop.interface";
import {DEFAULT_OPTIONS} from "./default.options";
import {animate, AnimationBuilder, AnimationFactory, AnimationPlayer, keyframes, style} from "@angular/animations";
import {DragItemDirective} from "./drag-item.directive";

@Directive({
  selector: '[drag-and-drop]'
})
export class DragAndDropDirective implements OnChanges, AfterContentInit {
  @Input() options: DragAndDropOptions = DEFAULT_OPTIONS;

  @ContentChildren(DragItemDirective) draggableElementsQueryList: QueryList<DragItemDirective>;
  draggableElements: DragItemDirective[];

  private upEvents: string[] = ['touchcancel', 'touchend', 'mouseup'];
  private downEvents: string[] = ['mousedown', 'touchstart'];
  private moveEvents: string[] = ['mousemove', 'touchmove'];
  private dragActive: boolean = false;
  private downTimerSubscription: Subscription;
  private dragItem: DragItemDirective;
  private draggedElement: HTMLElement;
  private animationFactory: AnimationFactory;
  private animationPlayer: AnimationPlayer;

  constructor(private elementRef: ElementRef, private animationBuilder: AnimationBuilder) {
    this.attachDownListeners();
    this.attachMoveListeners();
    this.attachUpListeners();
    this.initAnimationFactory();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this.options = {
        ...DEFAULT_OPTIONS,
        ...this.options
      }
    }
  }

  ngAfterContentInit(): void {
    this.draggableElements = Array.from(this.draggableElementsQueryList);
  }

  private initAnimationFactory(): void {
    const animationMetadata = animate((this.options.pressDelay - 20) + "ms", keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.2)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ]));

    this.animationFactory = this.animationBuilder.build(animationMetadata);
  }

  private attachDownListeners(): void {
    this.getListenerForEvents(this.downEvents).pipe(
      tap((event: MouseEvent | TouchEvent) => this.handleDownEvent(event))
    ).subscribe()
  }

  private attachUpListeners(): void {
    this.getListenerForEvents(this.upEvents).pipe(
      tap((event: MouseEvent | TouchEvent) => this.handleUpEvent(event))
    ).subscribe()
  }

  private attachMoveListeners(): void {
    this.getListenerForEvents(this.moveEvents).pipe(
      tap((event: MouseEvent | TouchEvent) => this.handleMoveEvent(event))
    ).subscribe()
  }

  private handleDownEvent(event: MouseEvent | TouchEvent): void {
    if (this.dragActive) {
      return;
    }

    this.dragItem = this.getDragItemFromEvent(event);
    if (this.dragItem) {
      this.dragItem.isDragItem = true;
    }
  }

  private handleMoveEvent(event: MouseEvent | TouchEvent): void {
    if(event instanceof MouseEvent) {
      if(this.dragActive) {
        this.moveDraggedElement(event.movementX, event.movementY);
          const underDragged = this.findElementUnderDragged();
          if (underDragged && !underDragged.animating) {
            this.moveBoxes(underDragged);
          }
      } else if(this.dragItem && event.movementX !== 0 && event.movementY !== 0 ) {
        this.initDraggedElement();
        //this.animatePress();
        this.dragActive = true;

        this.elementRef.nativeElement.appendChild(this.draggedElement);
        this.draggedElement.style.boxShadow = '0px 0px 12px 5px rgba(0, 0, 0, 0.4)';
        // TODO remove calculateCurrentPosition from here!

        this.calculateInitialPosition(this.dragItem.elementRef.nativeElement);
      }

    }
  }

  private handleUpEvent(event: MouseEvent | TouchEvent): void {
    this.downTimerSubscription?.unsubscribe();

    if (this.draggedElement) {
      this.elementRef.nativeElement.removeChild(this.draggedElement);
      this.draggedElement = null;
    }

    this.dragActive = false;
    this.dragItem = null;
  }

  private moveBoxes(targetItem: DragItemDirective): void {
    const targetX = targetItem.currentX;
    const targetY = targetItem.currentY;
    this.dragItem.moveToBox(targetX, targetY);
    let draggableElementsArray = this.draggableElements;

    const dragIndex = this.draggableElements.findIndex((el) => el=== this.dragItem);
    const targetIndex = this.draggableElements.findIndex((el) => el === targetItem);
    let sortDragIndex = dragIndex;
    let sortTargetIndex = targetIndex;
    console.log(dragIndex, targetIndex);
    if(dragIndex < targetIndex) {
      draggableElementsArray = [...this.draggableElements].reverse();
      sortTargetIndex = this.draggableElements.length - targetIndex - 1;
      sortDragIndex = this.draggableElements.length - dragIndex - 1;
    }
    draggableElementsArray.forEach((el, index) => {
      if (index >= sortDragIndex || index < sortTargetIndex) {
        return;
      }

      if(draggableElementsArray[index + 1].animating && draggableElementsArray[index + 1] !== this.dragItem) {
        el.moveToBox(draggableElementsArray[index + 1].backupX, draggableElementsArray[index + 1].backupY);
      } else {
        el.moveToBox(draggableElementsArray[index + 1].currentX, draggableElementsArray[index + 1].currentY);
      }
    });
    this.dragItem.currentX = targetX;
    this.dragItem.currentY = targetY;

    this.draggableElements.splice(targetIndex, 0, this.draggableElements.splice(dragIndex, 1)[0]);
  }

  private findElementUnderDragged(): DragItemDirective {
    const draggedRect = this.draggedElement.getBoundingClientRect();
    const target = document.elementFromPoint(draggedRect.x + (draggedRect.width / 2), draggedRect.y + (draggedRect.height / 2));

    if (target){
      return this.draggableElements.filter((item) => !item.dragDisabled).find((item) => {
        return item.elementRef.nativeElement === target.closest('[drag-item]') && item !== this.dragItem;
      });
    }

    return null;
  }

  private animatePress(): void{
    this.animationPlayer = this.animationFactory.create(this.dragItem.elementRef.nativeElement);

    this.animationPlayer.play();

    this.animationPlayer.onDone(() => {
      this.animationPlayer.destroy();
    });
  }

  private calculateInitialPosition(element: HTMLElement) {
    const elRects: DOMRect = element.getBoundingClientRect();

    this.draggedElement.style.transform = `translate(${elRects.x}px, ${elRects.y}px)`;
    this.draggedElement.style.margin = 'unset';
  }

  private moveDraggedElement(pointX: number, pointY: number) {
    const elRects: DOMRect = this.draggedElement.getBoundingClientRect();
    this.draggedElement.style.transform = `translate(${elRects.x + pointX}px, ${elRects.y + pointY}px)`;
  }

  private initDraggedElement(): void {
    this.draggedElement = this.dragItem.elementRef.nativeElement.cloneNode(true) as HTMLElement;
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.top = '0';
    this.draggedElement.style.left = '0';
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.classList.add('dragged-element');
  }

  private getDragItemFromEvent(event: MouseEvent | TouchEvent): DragItemDirective {
    return this.draggableElements.find((item) => item.elementRef.nativeElement === (event.target as HTMLElement).closest('[drag-item]'));
  }

  private getListenerForEvents(events: string[]): Observable<MouseEvent | TouchEvent> {
    return merge(...events.map((event) => fromEvent<MouseEvent | TouchEvent>(document.body, event)));
  }
}

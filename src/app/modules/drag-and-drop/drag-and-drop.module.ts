import {NgModule} from "@angular/core";
import {DragAndDropDirective} from "./drag-and-drop.directive";
import {DragItemDirective} from "./drag-item.directive";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [
    DragAndDropDirective,
    DragItemDirective
  ],
  exports: [
    DragAndDropDirective,
    DragItemDirective
  ],
  imports: [
    CommonModule
  ]
})
export class DragAndDropModule {

}

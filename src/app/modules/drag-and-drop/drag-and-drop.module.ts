import {NgModule} from "@angular/core";
import {DragAndDropDirective} from "./drag-and-drop.directive";
import {DragItemDirective} from "./drag-item.directive";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

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
    BrowserAnimationsModule
  ]
})
export class DragAndDropModule {

}

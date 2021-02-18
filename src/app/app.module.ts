import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {DragAndDropModule} from "./modules/drag-and-drop/drag-and-drop.module";

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        DragAndDropModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

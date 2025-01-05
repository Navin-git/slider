import { Component, signal, WritableSignal } from '@angular/core';
import {
  SliderComponent,
  slidesDataType,
} from './shared/component/slider/slider.component';
import { Slide1Component } from './ui/components/slide1/slide1.component';
import { Slide2Component } from './ui/components/slide2/slide2.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SliderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  activeSlide: WritableSignal<number> = signal(1);

  click() {
    this.activeSlide.set(3);
  }

  title = 'slider';
  slidesData: slidesDataType[] = [
    {
      component: Slide1Component,
      inputs: {
        message: 'I am slide 1',
      },
    },
    {
      component: Slide2Component,
    },
    {
      component: Slide1Component,
      inputs: {
        message: 'I am slide 3',
      },
    },
  ];
}

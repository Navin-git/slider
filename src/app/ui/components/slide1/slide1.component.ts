import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-slide1',
  standalone: true,
  imports: [],
  templateUrl: './slide1.component.html',
  styleUrl: './slide1.component.scss',
})
export class Slide1Component {
  @Input() message = 'hahaah';
}

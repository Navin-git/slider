import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  inject,
  WritableSignal,
  signal,
  effect,
  ContentChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Define the type for the slide data
export type slidesDataType = {
  component: any;
  inputs?: {
    [key: string]: string;
  };
};
@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent {
  // Inputs from the parent component
  @Input() slides!: slidesDataType[]; // Array of slide data
  @Input() navigator = true; // Controls visibility of next/previous buttons
  @Input() bullets = true; // Controls visibility of bullets for navigation
  @Input() currentSlide: WritableSignal<number> = signal(0); // Current slide index
  @Input() delay = 5000; // Dalay of loop
  @Input() loop = true; // Control boolen value of loop

  // Variables for managing the state of the slider
  hasPrevious = false;
  hasNext = false;
  startX = 0; // Starting X-coordinate for dragging
  offsetX = 0; // Offset X-coordinate for dragging
  isDragging = false;

  private element = inject(ElementRef<HTMLElement>)['nativeElement'];
  private resizeObserver: ResizeObserver | null = null;
  private autoSlideInterval: any;

  // Query the content projected into the component
  @ContentChild('previous', { static: false }) previousContent!: ElementRef;
  @ContentChild('next', { static: false }) nextContent!: ElementRef;

  // Query the view elements in the template
  @ViewChild('sliderContainer', { static: true }) sliderContainer!: ElementRef;
  @ViewChild('slideContainer', { static: true }) slideContainer!: ElementRef;

  // Constructor
  constructor() {
    effect(() => {
      if (this.currentSlide() >= 0) {
        console.log(this.currentSlide());
        this.setHeight();
      }
    });
  }

  // -------------------------- LIFECYCLE HOOKS --------------------------

  ngOnInit() {
    if (this.loop) this.startAutoLoop();

    this.resizeObserver = new ResizeObserver(() => {
      this.setHeight();
    });
    this.resizeObserver.observe(this.sliderContainer.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
  }

  ngAfterViewInit() {
    this.setHeight();
  }

  // Set the height of the slider container based on the current slide
  setHeight() {
    const slide_page =
      this.element.querySelectorAll('.slide')[this.currentSlide()];
    console.log(slide_page.clientHeight);
    if (slide_page) {
      this.slideContainer.nativeElement.style.height =
        slide_page.clientHeight + 'px';
    }
  }

  // -------------------------- SLIDE NAVIGATION --------------------------

  nextSlide() {
    const newIndex = this.currentSlide() + 1;
    this.transitionToSlide(newIndex);

    if (this.loop) this.resetAutoLoop();
  }

  prevSlide() {
    const newIndex = this.currentSlide() - 1;
    this.transitionToSlide(newIndex);

    if (this.loop) this.resetAutoLoop();
  }

  goToSlide(index: number) {
    this.transitionToSlide(index);
    if (this.loop) this.resetAutoLoop();
  }

  // -------------------------- SLIDE TRANSITIONS --------------------------

  transitionToSlide(index: number) {
    this.currentSlide.set(index);

    const width = this.sliderContainer.nativeElement.clientWidth;
    this.slideContainer.nativeElement.style.transition = 'all 300ms';
    this.slideContainer.nativeElement.style.transform = `translateX(-${
      width * index
    }px)`;

    // Adjust index after transition for infinite loop effect
    setTimeout(() => {
      if (index === 0) {
        this.currentSlide.set(this.slides.length);
        this.removeTransition();
      } else if (index === this.slides.length + 1) {
        this.currentSlide.set(1);
        this.removeTransition();
      }
    }, 300);
  }

  removeTransition() {
    const width = this.sliderContainer.nativeElement.clientWidth;
    this.slideContainer.nativeElement.style.transition = 'height 300ms';
    this.slideContainer.nativeElement.style.transform = `translateX(-${
      width * this.currentSlide()
    }px)`;
  }

  // -------------------------- DRAGGING HANDLING --------------------------

  // Handle mouse down event
  onMouseDown(event: MouseEvent) {
    this.sliderContainer.nativeElement.style.cursor = 'grabbing';
    this.isDragging = true;
    this.startX = event.clientX;
  }

  // Handle mouse move event (while dragging)
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const diffX = event.clientX - this.startX;
    this.offsetX = diffX;

    const width = this.sliderContainer.nativeElement.clientWidth;

    this.slideContainer.nativeElement.style.transition = 'none';

    this.slideContainer.nativeElement.style.transform = `translateX(${
      -width * this.currentSlide() + diffX
    }px)`;
  }

  // Handle mouse up event (end dragging)
  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.sliderContainer.nativeElement.style.cursor = 'grab';
    if (this.offsetX < -100) {
      this.nextSlide();
    } else if (this.offsetX > 100) {
      this.prevSlide();
    } else {
      this.transitionToSlide(this.currentSlide());
      this.resetPosition();
    }
    this.resetPosition();
  }

  // Handle touch start event
  onTouchStart(event: TouchEvent) {
    this.sliderContainer.nativeElement.style.cursor = 'grabbing';
    this.isDragging = true;
    this.startX = event.touches[0].clientX; // Record the initial touch position
  }

  // Handle touch move event
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    const diffX = event.touches[0].clientX - this.startX; // Calculate the difference
    this.offsetX = diffX;

    const width = this.sliderContainer.nativeElement.clientWidth;

    this.slideContainer.nativeElement.style.transition = 'none';
    this.slideContainer.nativeElement.style.transform = `translateX(${
      -width * this.currentSlide() + diffX
    }px)`; // Move the slide container
  }

  // Handle touch start end
  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.sliderContainer.nativeElement.style.cursor = 'grab';

    // Determine if swipe was significant enough to change slides
    if (this.offsetX < -100) {
      this.nextSlide(); // Swipe left
    } else if (this.offsetX > 100) {
      this.prevSlide(); // Swipe right
    } else {
      this.transitionToSlide(this.currentSlide()); // Reset position
    }

    this.resetPosition();
  }

  // Reset the dragging position
  resetPosition() {
    this.offsetX = 0;
  }

  // -------------------------- AUTO LOOP HANDLING --------------------------

  // Start the auto loop (default every 5 seconds)
  private startAutoLoop() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.delay);
  }

  // Reset the auto loop (stop the current interval and start a new one)
  private resetAutoLoop() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval); // Clear the current interval
    }
    if (this.loop) this.startAutoLoop();
  }
}

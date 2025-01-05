import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ContentChild,
  HostListener,
  inject,
  WritableSignal,
  signal,
  effect,
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

  // Query the content projected into the component
  @ContentChild('previous', { static: false }) previousContent!: ElementRef;
  @ContentChild('next', { static: false }) nextContent!: ElementRef;

  // Query the view elements in the template
  @ViewChild('sliderContainer', { static: true }) sliderContainer!: ElementRef;
  @ViewChild('slideContainer', { static: true }) slideContainer!: ElementRef;
  @ViewChild('slide', { static: true }) slide!: ElementRef;

  // Store the interval reference to clear it later
  private autoSlideInterval: any;

  // Constructor
  constructor() {
    effect(() => {
      if (this.currentSlide() >= 0) {
        this.setHeight(); // Adjust height on slide change
      }
    });
  }

  // -------------------------- LIFECYCLE HOOKS --------------------------

  ngOnInit() {
    if (this.loop) this.startAutoLoop(); // Start the auto loop
    // Resize observer to adjust the slider height on resize
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this.setHeight(); // Adjust the height when the container is resized
      }
    });

    this.resizeObserver.observe(this.sliderContainer.nativeElement);
  }

  ngAfterContentInit() {
    this.hasPrevious = Boolean(this.previousContent);
    this.hasNext = Boolean(this.nextContent);
  }

  // Cleanup when component is destroyed
  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect(); // Stop observing the resize events
    }
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval); // Clear the auto-slide interval
    }
  }

  // -------------------------- DOM & CONTENT HANDLING --------------------------

  // Set the height of the slider container based on the current slide
  setHeight() {
    const slide_page =
      this.element.querySelectorAll('.slide')[this.currentSlide()];
    if (slide_page) {
      this.slideContainer.nativeElement.style.height =
        slide_page.clientHeight + 'px';
    }
  }

  // -------------------------- SLIDE NAVIGATION --------------------------

  nextSlide() {
    if (this.currentSlide() < this.slides.length - 1) {
      this.currentSlide.update((prev) => prev + 1);
    } else if (this.loop) {
      // Loop back to the first slide after reaching the last one
      this.currentSlide.set(0);
    }

    if (this.loop) this.resetAutoLoop(); // Reset the auto loop after manual navigation
  }

  prevSlide() {
    if (this.currentSlide() > 0) {
      this.currentSlide.update((prev) => prev - 1);
    } else if (this.loop) {
      // Loop back to the last slide if at the first slide
      this.currentSlide.set(this.slides.length - 1);
    }

    if (this.loop) this.resetAutoLoop(); // Reset the auto loop after manual navigation
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    if (this.loop) this.resetAutoLoop(); // Reset the auto loop after manual navigation
  }

  // -------------------------- DRAGGING HANDLING --------------------------

  // Handle mouse down event
  onMouseDown(event: MouseEvent) {
    this.sliderContainer.nativeElement.style.cursor = 'grabbing';
    this.isDragging = true;
    this.startX = event.clientX;
  }

  // Handle mouse up event (end dragging)
  onMouseUp(event: MouseEvent) {
    this.sliderContainer.nativeElement.style.cursor = 'grab';

    if (!this.isDragging) return;
    this.isDragging = false;
    this.sliderContainer.nativeElement.style.transition =
      'transform 0.3s ease-out';

    const threshold = 100; // Minimum drag distance to change slides
    if (this.offsetX < -threshold) {
      this.nextSlide();
      this.resetPosition();
    } else if (this.offsetX > threshold) {
      this.prevSlide();
      this.resetPosition();
    } else {
      this.resetPosition();
      this.slideContainer.nativeElement.style.transform = `translateX(${
        -this.currentSlide() * 100
      }%)`; // Correct position of slides
    }
  }

  // Handle mouse move event (during dragging)
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const diffX = event.clientX - this.startX; // Calculate the difference in X position
    this.offsetX = diffX;

    // Move the slides during dragging, but only if it's within bounds
    if (
      (this.currentSlide() < this.slides.length - 1 && diffX < 0) || // Dragging left (next slide)
      (this.currentSlide() > 0 && diffX > 0) // Dragging right (previous slide)
    ) {
      this.slideContainer.nativeElement.style.transform = `translateX(${
        -this.sliderContainer.nativeElement.clientWidth * this.currentSlide() +
        diffX
      }px)`; // Update the position of the slides
    }
  }

  // Reset the dragging position
  resetPosition() {
    this.startX = 0;
    this.offsetX = 0;
  }

  // -------------------------- AUTO LOOP HANDLING --------------------------

  // Start the auto loop (every 5 seconds)
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

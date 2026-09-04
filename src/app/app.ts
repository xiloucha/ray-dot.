import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App
  implements OnInit, OnDestroy {

  displayType:
    | 'message'
    | 'clock'
    | 'timer'
    | 'countdown'
    = 'message';

  message = '';

  mode:
    | 'scroll'
    | 'still'
    | 'blink'
    = 'scroll';

  color = 'pink';

  displayStyle = 'neon';

  isDisplaying = false;

  scrollReady = false;

  ledSize = 8;

  scrollSpeed = 80;

  displayDuration = 5;

  displayChars: string[] = [];

  scrollCopies: string[][] = [];

  scrollDistance = 0;

  clockText = '00:00:00';

  timerSeconds = 0;

  timerRunning = false;

  countdownInputMinutes = 5;

  countdownSeconds = 300;

  countdownRunning = false;

  private timeInterval:
    ReturnType<typeof setInterval>
    | null = null;

  private fontData =
    new Map<number, string>();

  private patternCache =
    new Map<number, string[]>();

  private fontLoaded = false;

  private fontLoading:
    Promise<void>
    | null = null;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener(
      'popstate',
      this.handlePopState
    );

    this.updateClock();
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      'popstate',
      this.handlePopState
    );

    this.stopTimeLoop();
  }

  private handlePopState = (): void => {

    if (this.isDisplaying) {

      this.stopTimeLoop();

      this.isDisplaying = false;

      this.scrollReady = false;

      this.cdr.detectChanges();
    }
  };

  selectDisplayType(
    type:
      | 'message'
      | 'clock'
      | 'timer'
      | 'countdown'
  ): void {

    this.displayType = type;

    if (type !== 'message') {
      this.mode = 'still';
    }

    if (type === 'countdown') {

      this.countdownRunning = false;

      this.countdownSeconds =
        this.countdownInputMinutes * 60;
    }
  }

  async display(): Promise<void> {

    if (
      this.displayType === 'message'
    ) {

      if (
        this.message.trim() === ''
      ) {
        this.message = 'HELLO WORLD';
      }
    }

    try {

      await this.loadFont();

    } catch (error) {

      console.error(
        'RAY DOT. font loading failed:',
        error
      );

      return;
    }

    this.updateDisplayChars();

    this.scrollReady = false;

    this.scrollDistance = 0;

    this.scrollCopies = [
      [
        ...this.displayChars
      ]
    ];

    this.isDisplaying = true;

    history.pushState(
      {
        rayDotDisplay: true
      },
      ''
    );

    this.cdr.detectChanges();

    if (
      this.displayType !== 'message'
    ) {

      this.startTimeLoop();
    }

    if (
      this.displayType === 'message'
      &&
      this.mode === 'scroll'
    ) {

      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            () => {

              this.prepareScroll();

            }
          );

        }
      );
    }
  }

  private updateDisplayChars(): void {

    if (
      this.displayType === 'message'
    ) {

      this.displayChars =
        Array.from(this.message);

      return;
    }

    if (
      this.displayType === 'clock'
    ) {

      this.updateClock();

      this.displayChars =
        Array.from(this.clockText);

      return;
    }

    if (
      this.displayType === 'timer'
    ) {

      this.displayChars =
        Array.from(
          this.formatTime(
            this.timerSeconds
          )
        );

      return;
    }

    if (
      this.displayType === 'countdown'
    ) {

      this.displayChars =
        Array.from(
          this.formatTime(
            this.countdownSeconds
          )
        );

      return;
    }
  }

  private updateClock(): void {

    const now = new Date();

    const hours =
      String(
        now.getHours()
      ).padStart(2, '0');

    const minutes =
      String(
        now.getMinutes()
      ).padStart(2, '0');

    const seconds =
      String(
        now.getSeconds()
      ).padStart(2, '0');

    this.clockText =
      `${hours}:${minutes}:${seconds}`;
  }

  private formatTime(
    totalSeconds: number
  ): string {

    const safeSeconds =
      Math.max(
        0,
        Math.floor(totalSeconds)
      );

    const hours =
      Math.floor(
        safeSeconds / 3600
      );

    const minutes =
      Math.floor(
        (
          safeSeconds % 3600
        ) / 60
      );

    const seconds =
      safeSeconds % 60;

    return (
      String(hours).padStart(2, '0')
      + ':'
      + String(minutes).padStart(2, '0')
      + ':'
      + String(seconds).padStart(2, '0')
    );
  }

  private startTimeLoop(): void {

    this.stopTimeLoop();

    this.timeInterval =
      setInterval(
        () => {

          if (
            this.displayType === 'clock'
          ) {

            this.updateClock();
          }

          if (
            this.displayType === 'timer'
            &&
            this.timerRunning
          ) {

            this.timerSeconds++;
          }

          if (
            this.displayType === 'countdown'
            &&
            this.countdownRunning
          ) {

            if (
              this.countdownSeconds > 0
            ) {

              this.countdownSeconds--;
            }

            if (
              this.countdownSeconds <= 0
            ) {

              this.countdownSeconds = 0;

              this.countdownRunning = false;
            }
          }

          this.updateDisplayChars();

          this.cdr.detectChanges();

        },
        1000
      );
  }

  private stopTimeLoop(): void {

    if (this.timeInterval) {

      clearInterval(
        this.timeInterval
      );

      this.timeInterval = null;
    }
  }

  startTimer(): void {

    this.timerRunning = true;
  }

  pauseTimer(): void {

    this.timerRunning = false;
  }

  resetTimer(): void {

    this.timerRunning = false;

    this.timerSeconds = 0;

    this.updateDisplayChars();

    this.cdr.detectChanges();
  }

  startCountdown(): void {

    if (
      this.countdownSeconds <= 0
    ) {

      this.countdownSeconds =
        this.countdownInputMinutes * 60;
    }

    this.countdownRunning = true;
  }

  pauseCountdown(): void {

    this.countdownRunning = false;
  }

  resetCountdown(): void {

    this.countdownRunning = false;

    this.countdownSeconds =
      this.countdownInputMinutes * 60;

    this.updateDisplayChars();

    this.cdr.detectChanges();
  }

  onCountdownInputChange(): void {

    this.countdownRunning = false;

    this.countdownSeconds =
      this.countdownInputMinutes * 60;
  }

  private prepareScroll(): void {

    if (
      this.mode !== 'scroll'
      ||
      this.displayType !== 'message'
    ) {

      return;
    }

    const messageElement =
      document.querySelector(
        '.scroll-copy'
      ) as HTMLElement | null;

    if (!messageElement) {

      requestAnimationFrame(
        () => {

          this.prepareScroll();

        }
      );

      return;
    }

    const width =
      messageElement
        .getBoundingClientRect()
        .width;

    if (width <= 0) {

      requestAnimationFrame(
        () => {

          this.prepareScroll();

        }
      );

      return;
    }

    this.scrollDistance = width;

    const viewportWidth =
      window.innerWidth;

    const copyCount =
      Math.max(
        6,
        Math.ceil(
          viewportWidth / width
        ) + 5
      );

    this.scrollCopies =
      Array.from(
        {
          length: copyCount
        },
        () => [
          ...this.displayChars
        ]
      );

    this.displayDuration =
      Math.max(
        width / this.scrollSpeed,
        4
      );

    this.cdr.detectChanges();

    requestAnimationFrame(
      () => {

        requestAnimationFrame(
          () => {

            this.scrollReady = true;

            this.cdr.detectChanges();

          }
        );

      }
    );
  }

  stopDisplay(): void {

    this.stopTimeLoop();

    if (this.isDisplaying) {

      history.back();
    }
  }

  onSizeChange(): void {

    if (
      this.mode !== 'scroll'
      ||
      this.displayType !== 'message'
    ) {

      return;
    }

    this.scrollReady = false;

    this.cdr.detectChanges();

    requestAnimationFrame(
      () => {

        requestAnimationFrame(
          () => {

            this.prepareScroll();

          }
        );

      }
    );
  }

  private async loadFont(): Promise<void> {

    if (this.fontLoaded) {
      return;
    }

    if (this.fontLoading) {
      return this.fontLoading;
    }

    this.fontLoading =
      this.fetchFont();

    try {

      await this.fontLoading;

    } finally {

      this.fontLoading = null;
    }
  }

  private async fetchFont(): Promise<void> {

    const response =
      await fetch(
        'fonts/unifont_jp.hex'
      );

    if (!response.ok) {

      throw new Error(
        `Font file could not be loaded: ${response.status}`
      );
    }

    const text =
      await response.text();

    const lines =
      text.split(/\r?\n/);

    for (
      const line of lines
    ) {

      if (!line.trim()) {
        continue;
      }

      const separator =
        line.indexOf(':');

      if (separator === -1) {
        continue;
      }

      const codePoint =
        parseInt(
          line.slice(
            0,
            separator
          ),
          16
        );

      const bitmap =
        line
          .slice(
            separator + 1
          )
          .trim();

      if (
        Number.isNaN(codePoint)
        ||
        bitmap.length === 0
      ) {

        continue;
      }

      this.fontData.set(
        codePoint,
        bitmap
      );
    }

    this.fontLoaded = true;
  }

  getPattern(
    char: string
  ): string[] {

    const codePoint =
      char.codePointAt(0);

    if (
      codePoint === undefined
    ) {

      return this.blankPattern();
    }

    const cached =
      this.patternCache.get(
        codePoint
      );

    if (cached) {
      return cached;
    }

    let bitmap =
      this.fontData.get(
        codePoint
      );

    if (!bitmap) {

      bitmap =
        this.fontData.get(
          0x003f
        );

      if (!bitmap) {

        return this.blankPattern();
      }
    }

    const pattern =
      this.hexToPattern(
        bitmap
      );

    this.patternCache.set(
      codePoint,
      pattern
    );

    return pattern;
  }

  getRows(
    char: string
  ): string[][] {

    return this
      .getPattern(char)
      .map(
        row =>
          row.split('')
      );
  }

  private hexToPattern(
    hex: string
  ): string[] {

    const rows: string[] = [];

    if (hex.length === 64) {

      for (
        let y = 0;
        y < 16;
        y++
      ) {

        const rowHex =
          hex.slice(
            y * 4,
            y * 4 + 4
          );

        const row =
          parseInt(
            rowHex,
            16
          )
            .toString(2)
            .padStart(
              16,
              '0'
            );

        rows.push(row);
      }

      return rows;
    }

    if (hex.length === 32) {

      for (
        let y = 0;
        y < 16;
        y++
      ) {

        const rowHex =
          hex.slice(
            y * 2,
            y * 2 + 2
          );

        const row =
          parseInt(
            rowHex,
            16
          )
            .toString(2)
            .padStart(
              8,
              '0'
            );

        rows.push(
          '0000'
          +
          row
          +
          '0000'
        );
      }

      return rows;
    }

    return this.blankPattern();
  }

  private blankPattern(): string[] {

    return Array(16)
      .fill(
        '0'.repeat(16)
      );
  }
}
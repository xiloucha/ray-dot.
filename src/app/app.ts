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


  /* =========================
     DISPLAY TYPE
  ========================= */

  displayType:
    | 'message'
    | 'clock'
    | 'timer'
    | 'countdown'
    = 'message';


  /* =========================
     MESSAGE
  ========================= */

  message = '';


  /* =========================
     DISPLAY MODE
  ========================= */

  mode:
    | 'scroll'
    | 'still'
    | 'blink'
    = 'scroll';


  /* =========================
     COLOR
  ========================= */

  color = 'pink';


  /* =========================
     STYLE
  ========================= */

  displayStyle = 'neon';


  /* =========================
     DISPLAY STATE
  ========================= */

  isDisplaying = false;

  scrollReady = false;


  /* =========================
     LED
  ========================= */

  ledSize = 8;


  /* =========================
     SCROLL
  ========================= */

  scrollSpeed = 80;

  displayDuration = 5;

  displayChars: string[] = [];

  scrollCopies: string[][] = [];

  scrollDistance = 0;


  /* =========================
     CLOCK
  ========================= */

  clockText = '00:00:00';


  /* =========================
     TIMER
  ========================= */

  timerSeconds = 0;

  timerRunning = false;


  /* =========================
     COUNTDOWN
  ========================= */

  countdownInputMinutes = 5;

  countdownSeconds = 300;

  countdownRunning = false;


  /* =========================
     INTERVAL
  ========================= */

  private timeInterval:
    ReturnType<typeof setInterval>
    | null = null;


  /* =========================
     FONT
  ========================= */

  private fontData =
    new Map<number, string>();

  private patternCache =
    new Map<number, string[]>();

  private fontLoaded = false;

  private fontLoading:
    Promise<void>
    | null = null;


  constructor(
    private cdr:
      ChangeDetectorRef
  ) {}


  /* =========================
     LIFECYCLE
  ========================= */

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


  /* =========================
     BROWSER BACK
  ========================= */

  private handlePopState = (): void => {

    if (
      this.isDisplaying
    ) {

      this.stopTimeLoop();

      this.isDisplaying = false;

      this.scrollReady = false;

      this.cdr.detectChanges();

    }

  };


  /* =========================
     DISPLAY TYPE
  ========================= */

  selectDisplayType(
    type:
      | 'message'
      | 'clock'
      | 'timer'
      | 'countdown'
  ): void {

    this.displayType =
      type;


    /*
      MESSAGE以外は
      スクロールを使わない
    */

    if (
      type !== 'message'
    ) {

      this.mode =
        'still';

    }


    /*
      COUNTDOWN選択時
    */

    if (
      type === 'countdown'
    ) {

      this.countdownRunning =
        false;

      this.countdownSeconds =
        this.countdownInputMinutes
        * 60;

    }

  }


  /* =========================
     DISPLAY
  ========================= */

  async display(): Promise<void> {


    /*
      MESSAGE
    */

    if (
      this.displayType ===
      'message'
    ) {

      if (
        this.message.trim() === ''
      ) {

        this.message =
          'HELLO WORLD';

      }

    }


    /*
      FONT
    */

    try {

      await this.loadFont();

    } catch (
      error
    ) {

      console.error(
        'RAY DOT. font loading failed:',
        error
      );

      return;

    }


    /*
      DISPLAY TEXT
    */

    this.updateDisplayChars();


    /*
      SCROLL RESET
    */

    this.scrollReady =
      false;

    this.scrollDistance =
      0;


    /*
      FIRST COPY
    */

    this.scrollCopies =
      [
        [
          ...this.displayChars
        ]
      ];


    /*
      DISPLAY ON
    */

    this.isDisplaying =
      true;


    history.pushState(
      {
        rayDotDisplay: true
      },
      ''
    );


    this.cdr.detectChanges();


    /*
      CLOCK / TIMER / COUNTDOWN
    */

    if (
      this.displayType !==
      'message'
    ) {

      this.startTimeLoop();

      this.timeInterval = setInterval(() => {

        console.log(
          'TIME LOOP',
          this.displayType,
          this.timerSeconds,
          this.countdownSeconds
        );
      
        // 以下そのまま

    }


    /*
      SCROLL
    */

    if (
      this.displayType ===
      'message'
      &&
      this.mode ===
      'scroll'
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


  /* =========================
     UPDATE DISPLAY
  ========================= */

  private updateDisplayChars():
    void {


    /*
      MESSAGE
    */

    if (
      this.displayType ===
      'message'
    ) {

      this.displayChars =
        Array.from(
          this.message
        );

      return;

    }


    /*
      CLOCK
    */

    if (
      this.displayType ===
      'clock'
    ) {

      this.updateClock();

      this.displayChars =
        Array.from(
          this.clockText
        );

      return;

    }


    /*
      TIMER
    */

    if (
      this.displayType ===
      'timer'
    ) {

      this.displayChars =
        Array.from(
          this.formatTime(
            this.timerSeconds
          )
        );

      return;

    }


    /*
      COUNTDOWN
    */

    if (
      this.displayType ===
      'countdown'
    ) {

      this.displayChars =
        Array.from(
          this.formatTime(
            this.countdownSeconds
          )
        );

    }

  }


  /* =========================
     CLOCK
  ========================= */

  private updateClock():
    void {

    const now =
      new Date();


    const hours =
      String(
        now.getHours()
      )
      .padStart(
        2,
        '0'
      );


    const minutes =
      String(
        now.getMinutes()
      )
      .padStart(
        2,
        '0'
      );


    const seconds =
      String(
        now.getSeconds()
      )
      .padStart(
        2,
        '0'
      );


    this.clockText =
      `${hours}:${minutes}:${seconds}`;

  }


  /* =========================
     FORMAT TIME
  ========================= */

  private formatTime(
    totalSeconds:
      number
  ): string {

    const safeSeconds =
      Math.max(
        0,
        Math.floor(
          totalSeconds
        )
      );


    const hours =
      Math.floor(
        safeSeconds
        / 3600
      );


    const minutes =
      Math.floor(
        (
          safeSeconds
          % 3600
        )
        / 60
      );


    const seconds =
      safeSeconds
      % 60;


    return (
      String(
        hours
      )
      .padStart(
        2,
        '0'
      )
      +
      ':'
      +
      String(
        minutes
      )
      .padStart(
        2,
        '0'
      )
      +
      ':'
      +
      String(
        seconds
      )
      .padStart(
        2,
        '0'
      )
    );

  }


  /* =========================
     TIME LOOP
  ========================= */

  private startTimeLoop():
    void {

    this.stopTimeLoop();


    this.timeInterval =
      setInterval(
        () => {


          /*
            CLOCK
          */

          if (
            this.displayType ===
            'clock'
          ) {

            this.updateClock();

          }


          /*
            TIMER
          */

          if (
            this.displayType ===
            'timer'
            &&
            this.timerRunning
          ) {

            this.timerSeconds++;

          }


          /*
            COUNTDOWN
          */

          if (
            this.displayType ===
            'countdown'
            &&
            this.countdownRunning
          ) {

            if (
              this.countdownSeconds >
              0
            ) {

              this.countdownSeconds--;

            }


            if (
              this.countdownSeconds <=
              0
            ) {

              this.countdownSeconds =
                0;

              this.countdownRunning =
                false;

            }

          }


          this.updateDisplayChars();

          this.cdr.detectChanges();


        },
        1000
      );

  }


  private stopTimeLoop():
    void {

    if (
      this.timeInterval
    ) {

      clearInterval(
        this.timeInterval
      );

      this.timeInterval =
        null;

    }

  }


  /* =========================
     TIMER
  ========================= */

  startTimer():
    void {

    this.timerRunning =
      true;

  }


  pauseTimer():
    void {

    this.timerRunning =
      false;

  }


  resetTimer():
    void {

    this.timerRunning =
      false;

    this.timerSeconds =
      0;

    this.updateDisplayChars();

    this.cdr.detectChanges();

  }


  /* =========================
     COUNTDOWN
  ========================= */

  startCountdown():
    void {

    if (
      this.countdownSeconds <=
      0
    ) {

      this.countdownSeconds =
        this.countdownInputMinutes
        * 60;

    }


    this.countdownRunning =
      true;

  }


  pauseCountdown():
    void {

    this.countdownRunning =
      false;

  }


  resetCountdown():
    void {

    this.countdownRunning =
      false;

    this.countdownSeconds =
      this.countdownInputMinutes
      * 60;

    this.updateDisplayChars();

    this.cdr.detectChanges();

  }


  onCountdownInputChange():
    void {

    this.countdownRunning =
      false;

    this.countdownSeconds =
      this.countdownInputMinutes
      * 60;

  }


  /* =========================
     PREPARE SCROLL
  ========================= */

  private prepareScroll():
    void {

    if (
      this.mode !==
      'scroll'
      ||
      this.displayType !==
      'message'
    ) {

      return;

    }


    const messageElement =
  document.querySelector(
    '.scroll-copy'
  ) as HTMLElement | null;

    if (
      !messageElement
    ) {

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


    if (
      width <=
      0
    ) {

      requestAnimationFrame(
        () => {

          this.prepareScroll();

        }
      );

      return;

    }


    this.scrollDistance =
      width;


    const viewportWidth =
      window.innerWidth;


    const copyCount =
      Math.max(
        6,
        Math.ceil(
          viewportWidth
          / width
        )
        + 5
      );


    this.scrollCopies =
      Array.from(
        {
          length:
            copyCount
        },
        () =>
          [
            ...this.displayChars
          ]
      );


    this.displayDuration =
      Math.max(
        width
        / this.scrollSpeed,
        4
      );


    this.cdr.detectChanges();


    requestAnimationFrame(
      () => {

        requestAnimationFrame(
          () => {

            this.scrollReady =
              true;

            this.cdr.detectChanges();

          }
        );

      }
    );

  }


  /* =========================
     EDIT
  ========================= */

  stopDisplay():
    void {

    this.stopTimeLoop();


    if (
      this.isDisplaying
    ) {

      history.back();

    }

  }


  /* =========================
     SIZE CHANGE
  ========================= */

  onSizeChange():
    void {

    if (
      this.mode !==
      'scroll'
      ||
      this.displayType !==
      'message'
    ) {

      return;

    }


    this.scrollReady =
      false;

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


  /* =========================
     FONT LOADING
  ========================= */

  private async loadFont():
    Promise<void> {

    if (
      this.fontLoaded
    ) {

      return;

    }


    if (
      this.fontLoading
    ) {

      return this.fontLoading;

    }


    this.fontLoading =
      this.fetchFont();


    try {

      await this.fontLoading;

    } finally {

      this.fontLoading =
        null;

    }

  }


  private async fetchFont():
    Promise<void> {

    const response =
      await fetch(
        'fonts/unifont_jp.hex'
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `Font file could not be loaded: ${response.status}`
      );

    }


    const text =
      await response.text();


    const lines =
      text.split(
        /\r?\n/
      );


    for (
      const line
      of lines
    ) {

      if (
        !line.trim()
      ) {

        continue;

      }


      const separator =
        line.indexOf(
          ':'
        );


      if (
        separator ===
        -1
      ) {

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
        line.slice(
          separator + 1
        )
        .trim();


      if (
        Number.isNaN(
          codePoint
        )
        ||
        bitmap.length ===
        0
      ) {

        continue;

      }


      this.fontData.set(
        codePoint,
        bitmap
      );

    }


    this.fontLoaded =
      true;

  }


  /* =========================
     CHARACTER PATTERN
  ========================= */

  getPattern(
    char:
      string
  ):
    string[] {

    const codePoint =
      char.codePointAt(
        0
      );


    if (
      codePoint ===
      undefined
    ) {

      return this.blankPattern();

    }


    const cached =
      this.patternCache.get(
        codePoint
      );


    if (
      cached
    ) {

      return cached;

    }


    let bitmap =
      this.fontData.get(
        codePoint
      );


    /*
      未対応文字は
      ? を表示
    */

    if (
      !bitmap
    ) {

      bitmap =
        this.fontData.get(
          0x003f
        );


      if (
        !bitmap
      ) {

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
    char:
      string
  ):
    string[][] {

    return this
      .getPattern(
        char
      )
      .map(
        row =>
          row.split(
            ''
          )
      );

  }


  /* =========================
     HEX → DOT MATRIX
  ========================= */

  private hexToPattern(
    hex:
      string
  ):
    string[] {

    const rows:
      string[] =
      [];


    /*
      16 × 16
    */

    if (
      hex.length ===
      64
    ) {

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
          .toString(
            2
          )
          .padStart(
            16,
            '0'
          );


        rows.push(
          row
        );

      }


      return rows;

    }


    /*
      8 × 16
    */

    if (
      hex.length ===
      32
    ) {

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
          .toString(
            2
          )
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


  /* =========================
     EMPTY CHARACTER
  ========================= */

  private blankPattern():
    string[] {

    return Array(
      16
    )
    .fill(

      '0'.repeat(
        16
      )

    );

  }

}
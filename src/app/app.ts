import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  message = '';

  mode = 'scroll';

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


  private fontData =
    new Map<number, string>();

  private patternCache =
    new Map<number, string[]>();

  private fontLoaded = false;

  private fontLoading:
    Promise<void> | null = null;


  constructor(
    private cdr: ChangeDetectorRef
  ) {}


  /* =========================
     LIFECYCLE
  ========================= */

  ngOnInit(): void {

    window.addEventListener(
      'popstate',
      this.handlePopState
    );

  }


  ngOnDestroy(): void {

    window.removeEventListener(
      'popstate',
      this.handlePopState
    );

  }


  /* =========================
     BROWSER BACK
  ========================= */

  private handlePopState = (): void => {

    if (this.isDisplaying) {

      this.isDisplaying = false;

      this.scrollReady = false;

      this.cdr.detectChanges();

    }

  };


  /* =========================
     DISPLAY
  ========================= */

  async display(): Promise<void> {

    if (
      this.message.trim() === ''
    ) {

      this.message =
        'HELLO WORLD';

    }


    /*
      ① フォント読み込み
    */

    try {

      await this.loadFont();

    } catch (error) {

      console.error(
        'RAY DOT. font loading failed:',
        error
      );

      return;

    }


    /*
      ② 表示文字を作る
    */

    this.displayChars =
      Array.from(this.message);


    /*
      ③ スクロール開始前の状態
    */

    this.scrollReady = false;

    this.scrollDistance = 0;


    /*
      最初の描画用コピー。

      ここでAngularが実際に
      文字を画面へ描画する。
    */

    this.scrollCopies =
      [
        [...this.displayChars]
      ];


    /*
      ④ DISPLAY画面へ切り替え
    */

    this.isDisplaying = true;


    history.pushState(
      {
        rayDotDisplay: true
      },
      ''
    );


    /*
      Angularに
      今すぐ画面を描画させる
    */

    this.cdr.detectChanges();


    /*
      ⑤ 描画後に
      実際の文字幅を測定
    */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        this.prepareScroll();

      });

    });

  }


  /* =========================
     PREPARE SCROLL
  ========================= */

  private prepareScroll(): void {

    if (
      this.mode !== 'scroll'
    ) {

      return;

    }


    /*
      実際に描画された
      文字の幅を取得
    */

    const messageElement =
      document.querySelector(
        '.scroll-copy'
      ) as HTMLElement | null;


    if (!messageElement) {

      requestAnimationFrame(() => {

        this.prepareScroll();

      });

      return;

    }


    const width =
      messageElement
        .getBoundingClientRect()
        .width;


    /*
      まだレイアウト計算が
      終わっていない場合
    */

    if (
      width <= 0
    ) {

      requestAnimationFrame(() => {

        this.prepareScroll();

      });

      return;

    }


    /*
      ⑥ 1メッセージ分の
      実際の幅を保存
    */

    this.scrollDistance =
      width;


    /*
      ⑦ 画面幅に応じて
      必要なコピー数を計算
    */

    const viewportWidth =
      window.innerWidth;


    const copyCount =
      Math.max(
        6,
        Math.ceil(
          viewportWidth / width
        ) + 5
      );


    /*
      コピーを増やす
    */

    this.scrollCopies =
      Array.from(
        {
          length: copyCount
        },
        () =>
          [...this.displayChars]
      );


    /*
      ⑧ スクロール時間

      実際の文字幅 ÷ 速度
    */

    this.displayDuration =
      Math.max(
        width /
        this.scrollSpeed,
        4
      );


    /*
      コピー数・距離・時間を
      Angularへ反映
    */

    this.cdr.detectChanges();


    /*
      ⑨ DOM更新後、
      次の描画フレームで
      スクロール開始
    */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        this.scrollReady = true;

        this.cdr.detectChanges();

      });

    });

  }


  /* =========================
     EDIT
  ========================= */

  stopDisplay(): void {

    if (
      this.isDisplaying
    ) {

      history.back();

    }

  }


  /* =========================
     SIZE CHANGE
  ========================= */

  onSizeChange(): void {

    if (
      this.mode !== 'scroll'
    ) {

      return;

    }


    /*
      サイズ変更時はいったん停止
    */

    this.scrollReady = false;

    this.cdr.detectChanges();


    /*
      新しいドットサイズで
      DOMの幅を測り直す
    */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        this.prepareScroll();

      });

    });

  }


  /* =========================
     FONT LOADING
  ========================= */

  private async loadFont(): Promise<void> {

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

      this.fontLoading = null;

    }

  }


  private async fetchFont(): Promise<void> {

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
      const line of lines
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
        separator === -1
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
        ).trim();


      if (
        Number.isNaN(
          codePoint
        ) ||
        bitmap.length === 0
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
    char: string
  ): string[] {

    const codePoint =
      char.codePointAt(
        0
      );


    if (
      codePoint === undefined
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
    char: string
  ): string[][] {

    return this
      .getPattern(
        char
      )
      .map(
        row =>
          row.split('')
      );

  }


  /* =========================
     HEX → DOT MATRIX
  ========================= */

  private hexToPattern(
    hex: string
  ): string[] {

    const rows:
      string[] = [];


    /*
      16 × 16
    */

    if (
      hex.length === 64
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
      hex.length === 32
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

          '0000' +
          row +
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
    ).fill(

      '0'.repeat(
        16
      )

    );

  }

}
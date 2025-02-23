import { Component, ElementRef, Input, OnInit, ViewChild, OnChanges, ViewEncapsulation} from '@angular/core';
import * as _ from 'lodash-es';
import { EditorService} from '../../services/editor/editor.service';
import { PlayerService } from '../../services/player/player.service';
import { ConfigService } from '../../services/config/config.service';
declare var $: any;

@Component({
  selector: 'lib-contentplayer-page',
  templateUrl: './content-player-page.component.html',
  styleUrls: ['./content-player-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ContentPlayerPageComponent implements OnInit, OnChanges {
  @ViewChild('contentIframe') contentIframe: ElementRef;
  @Input() contentMetadata: any;
  @Input() collectionData: any;
  public contentDetails: any;
  public playerConfig: any;
  public content: any;
  public playerType: string;
  public contentId: string;
  hierarchy: any;

  constructor(private editorService: EditorService, private playerService: PlayerService,
              public configService: ConfigService) { }

  ngOnInit() {}

  ngOnChanges() {
    this.contentMetadata = _.get(this.contentMetadata, 'data.metadata') || this.contentMetadata;
    if (this.contentId !== this.contentMetadata.identifier) {
      this.contentId = this.contentMetadata.identifier;
      if ((this.contentMetadata?.objectType).toLowerCase() === 'question') {
        this.getContentDetails('question');
      } else {
        this.getContentDetails('content');
      }
    }
  }
  getContentDetails(objectType) {
    this.playerType = 'default-player';
    this.editorService.fetchContentDetails(this.contentId, objectType).subscribe(res => {
      this.contentDetails = {
        contentId : this.contentId,
        contentData: {}
      };
      if (objectType === 'question') {
        this.contentDetails.contentData =  _.get(res, 'result.question');
      } else if (objectType === 'content') {
        this.contentDetails.contentData =  _.get(res, 'result.content');
      }
      this.playerConfig = this.playerService.getPlayerConfig(this.contentDetails);
      this.setPlayerType();
      this.playerType === 'default-player' ? this.loadDefaultPlayer() : this.playerConfig.config = {};
    });
  }

  setPlayerType() {
    const playerType = _.get(this.configService.playerConfig, 'playerType');
    _.forIn(playerType, (value, key) => {
      if (value.length) {
        if (_.includes(value, _.get(this.contentDetails, 'contentData.mimeType'))) {
          this.playerType = key;
        }
      }
    });

    if (_.get(this.contentDetails, 'contentData.mimeType') === 'application/vnd.sunbird.question') {
      this.playerType = 'qml';
    }
  }

  loadDefaultPlayer() {
    // const iFrameSrc = this.configService.appConfig.PLAYER_CONFIG.baseURL + '&build_number=' + this.buildNumber;
    const iFrameSrc = `/content/preview/preview.html?webview=true&build_number=2.8.0.e552fcd`;
    setTimeout(() => {
      const playerElement = this.contentIframe.nativeElement;
      playerElement.src = iFrameSrc;
      playerElement.onload = (event) => {
        try {
          this.adjustPlayerHeight();
          playerElement.contentWindow.initializePreview(this.playerConfig);
        } catch (err) {
          console.log('loading default player failed', err);
        }
      };
    }, 0);
  }

  /**
   * Adjust player height after load
   */
  adjustPlayerHeight() {
    const playerWidth = $('#contentPlayer').width();
    if (playerWidth) {
      const height = playerWidth * (9 / 16);
      $('#contentPlayer').css('height', height + 'px');
    }
  }

  eventHandler(e) {}

  generateContentReadEvent(e, boo) {}
}

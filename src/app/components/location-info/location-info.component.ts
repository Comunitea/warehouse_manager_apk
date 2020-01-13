import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { VoiceService } from '../../services/voice.service';

@Component({
  selector: 'app-location-info',
  templateUrl: './location-info.component.html',
  styleUrls: ['./location-info.component.scss'],
})
export class LocationInfoComponent implements OnInit {

  @Input() location: {}
  ngSwitch: any

  constructor(public router: Router, private voice: VoiceService,) { }

  ngOnInit() {
    this.voice.voice_command_refresh$.subscribe(data => {
      this.voice_command_check();
    });
  }

  open_link(type, location_id){
    if (type == 'stock') {
      this.router.navigateByUrl('/stock-quant-list/'+location_id);
    } else {
      this.router.navigateByUrl('/stock-location-product-list/'+location_id);
    } 
  }

  // Voice command

  voice_command_check() {
    console.log("voice_command_check");
    console.log(this.voice.voice_command);
    if (this.voice.voice_command) {
      let voice_command_register = this.voice.voice_command;
      console.log("Recibida orden de voz: " + voice_command_register);
      
      if (this.check_if_value_in_responses("stock", voice_command_register)) {
        console.log("Stock");
        this.router.navigateByUrl('/stock-quant-list/'+this.location['id']);
      } else if (this.check_if_value_in_responses("productos", voice_command_register)){
        console.log("Productos");
        this.router.navigateByUrl('/stock-location-product-list/'+this.location['id']);
      }
    }
  }

  check_if_value_in_responses(value, dict) {
    if(value == dict[0] || value == dict[1] || value == dict[2]) {
      return true;
    } else {
      return false;
    }
  }

}

import Caver from "caver-js";
import {Spinner} from 'spin.js';

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);

const caver_klay = new Caver(klaytn)
const agContract = new caver_klay.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);

let isLogin = false;

const App = {
  auth: {
    accessType: 'keystore',
    keystore: '',
    password: ''
  },

  accountChanged : function(){
    klaytn.on('accountsChanged', function(accounts) {
      App.changeUI()
    })
  },

  start: async function () {

    this.accountChanged()

    if (!klaytn){
      return;
    }

    if (!klaytn.publicConfigStore.getState().isUnlocked)
    {
      return;
    }

    await klaytn.enable()
      .then(function(accounts){
        const account = accounts[0]
        console.log(account)
        isLogin = true
        App.changeUI()
      })
      .catch(err => {
        alert(err.message)
      })   

    const walletFromSession = sessionStorage.getItem('walletInstance');
    if (walletFromSession) {
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession));
        this.changeUI(JSON.parse(walletFromSession));
      } catch (e) {      
        sessionStorage.removeItem('walletInstance');
      }
    }
  },

  handleImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (event) => {      
      try {     
        if (!this.checkValidKeystore(event.target.result)) {
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        }    
        this.auth.keystore = event.target.result;
        $('#message').text('keystore 통과. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();    
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    }   
  },

  kaikasLogin: async function () {
    const wallet = await klaytn.enable()

    if (wallet !== undefined){
      let version = await window.klaytn.networkVersion;
      isLogin =true;
      this.changeUI();
    }

  },

  handleLogout: async function () {
    isLogin =false;
    this.changeUI();
  },

  generateNumbers: async function () {
    var num1 = Math.floor((Math.random() * 50) + 10);
    var num2 = Math.floor((Math.random() * 50) + 10);
    sessionStorage.setItem('result', num1 + num2);

    $('#start').hide();
    $('#start').hide();
    $('#num1').text(num1);
    $('#num2').text(num2);
    $('#question').show();
    document.querySelector('#answer').focus();

    this.showTimer();
  },

  submitAnswer: async function () {
    const result = sessionStorage.getItem('result');
    var answer = $('#answer').val();

    if(answer === result){
      if (confirm("정답! 0.1 KLAY 받기")){
        if (await this.callContractBalance() >= 0.1){
          this.receiveKlay();
        }else{
          alert('컨트랙 계정에 klay가 없습니다.')
        }
      }
    }else{
      alert('땡!')
    }

  },

  deposit: async function () {
    var spinner = this.showSpinner();

    const wallets = await klaytn.enable();
    const wallet = wallets[0]
    console.log(wallet)

    if ((await this.callOwner()).toUpperCase() !== wallet.toUpperCase()){
      alert('Owner 계정만 실행할 수 있음')
      spinner.stop();  
      return; 
    } 
    else {
      var amount = $('#amount').val();
      console.log(amount)
      if (amount) {
        agContract.methods.deposit().send({
          from: klaytn.selectedAddress,
          gas: '200000',
          value: cav.utils.toPeb(amount, "KLAY")
        })
        .then(receipt => {
          console.log(receipt);
          if (receipt.status){
            alert(amount + " KLAY를 컨트랙에 송금했습니다.");               
            location.reload();
          } else{
            alert("컨트랙트 실패.");               
          }
          spinner.stop();  
        })
        .catch(err => {
          alert(err.message)
          spinner.stop();  
        })        

      }
      return;    
    }

  },

  callOwner: async function () {
    return await agContract.methods.owner().call();
  },

  callContractBalance: async function () {
    return await agContract.methods.getBalance().call();
  },

  getWallet: function () {
    if (cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0];
    }
  },

  checkValidKeystore: function (keystore) {
    const parsedKeystore = JSON.parse(keystore);
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.keyring;  

    return isValidKeystore;
  },

  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);
    cav.klay.accounts.wallet.add(walletInstance)
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    this.changeUI(walletInstance);  
  },

  reset: function () {
    this.auth = {
      keystore: '',
      password: ''
    };
  },

  changeUI: async function () {

    if(isLogin){
      $("#login").hide(); 
      $('#logout').show();
      $('#game').show();
      $('#address').html('<br>' + '<p>' + '내 계정 주소: ' + klaytn.selectedAddress + '</p>');   
      $('#contractBalance').html('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(await this.callContractBalance(), "KLAY") + ' KLAY' + '</p>');     
      
      const contractOwner = await this.callOwner()
      if (contractOwner.toUpperCase() === klaytn.selectedAddress.toUpperCase()) {
        $("#owner").show(); 
      }else{
        $("#owner").hide(); 
      }     
    }else{
      $("#login").show(); 
      $('#logout').hide();
      $('#game').hide();
      $('#address').html('');   
      $('#contractBalance').html('');     
      $("#owner").hide();   
    }
  },

  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    sessionStorage.removeItem('walletInstance');
    this.reset();
  },

  showTimer: function () {

    var seconds = 5;
    $('#timer').text(seconds);

    var interval = setInterval(() => {
      $('#timer').text(--seconds);
      if(seconds <= 0){
        $('#timer').text('');
        $('#answer').val('');
        $('#question').hide();
        $('#start').show();
        clearInterval(interval)
      }
    }, 1000);
  },

  showSpinner: function () {
    var target = document.getElementById('spin');
    return new Spinner(opts).spin(target);
  },

  receiveKlay: function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    agContract.methods.transfer(cav.utils.toPeb("0.1","KLAY")).send({
      from: klaytn.selectedAddress,
      gas: '250000'
    }).then(function (receipt){
      console.log(receipt)
      if (receipt.status) {
        spinner.stop();
        alert("0.1 KLAY가 " + klaytn.selectedAddress + " 계정으로 지급되었습니다.");
        $('#transaction').html('')
        $('#transaction').append(`<p><a href='https://baobab.klaytnscope.com/tx/${receipt.txHash}' target='_blank'>클레이튼 Scope에서 트랜젝션 확인</a></p>`);
        return agContract.methods.getBalance().call()
          .then(function (balance){
            $('#contractBalance').html("");
            $('#contractBalance').append('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(balance, "KLAY") + ' KLAY' + '</p>');
          })
      }
    })
  }
};

window.App = App;

window.addEventListener("load", function () { 
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};
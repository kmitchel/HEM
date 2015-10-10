
var machine = {
	states : {
		ready : 1,
		set : 2,
		query : 3
	},
	state : 1, //can't use this.states.ready since it may not exist yet
	property : '',
	value : '',
	memory : {},
	reset : function (){
		this.property = '';
		this.value = '';
		this.state = this.states.ready;	
	},
	run : function (chunk){
		switch (this.state){
			case this.states.ready:
				if (chunk >= 'a' && chunk <= 'z') {
					this.property += chunk;
				} else if (chunk == '=') {
					this.state = this.states.set;
				} else if (chunk == '?') {
					this.state = this.states.query;
				} else {
					console.log('err');
					this.reset();
				};
				break;
			case this.states.set:
				if (chunk >= '0' && chunk <= '9' && this.property > ''){
					this.value = this.value * 10 + Number(chunk);
				} else if (chunk =='\r' && this.property > '' && this.value > ''){
					this.memory[this.property] = this.value;
					console.log('ok');
					this.reset();
				} else {
					console.log('err');
					this.reset();
				};
				break;
			case this.states.query:
				if (chunk == '\r' && this.property > '') {
					console.log(this.memory[this.property]);
					this.reset();
				} else {
					console.log('err');
					this.reset();
				};
				break;
			};
		console.log(this); //see what the machine looks like
	},
};

process.stdin.setRawMode(true); //i want a data event for each char
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
	if (chunk == '\x03') { //catch ctrl-c
			process.exit();
	} else {
	machine.run(chunk);
	};
});


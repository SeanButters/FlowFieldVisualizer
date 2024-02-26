const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


class Particle{
    constructor(effect, rgb){
        this.effect = effect;
        this.x = ~~(Math.random() * this.effect.width);
        this.y = ~~(Math.random() * this.effect.height);
        this.velocity = {x: 0, y: 0};
        this.velocityBoost = Math.random() * 2 + 0.5;
        this.history = [{x: this.x, y: this.y}];
        this.maxLength = 100;
        this.timer = this.maxLength * (3-this.velocityBoost) * 2;
        this.rgb = this.modifyColor(rgb, Math.random()*126 - 63);
    }

    modifyColor(color, offset){
        color = color.slice(1);
        var rgb = parseInt(color,16);

        var r = ((rgb >> 16) & 0xFF) + offset;
        if ( r > 255 ) r = 255;
        else if  (r < 0) r = 0;

        var b = ((rgb >> 8) & 0xFF) + offset;
        if ( b > 255 ) b = 255;
        else if  (b < 0) b = 0;
        
        var g = (rgb & 0xFF) + offset;
        if ( g > 255 ) g = 255;
        else if  ( g < 0 ) g = 0;
    
        return "#" + (g | (b << 8) | (r << 16)).toString(16);
    }

    draw(context){
        ctx.strokeStyle = this.rgb;
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y);
        this.history.forEach(element =>{
            context.lineTo(element.x, element.y);
        });
        context.stroke();
    }

    update(){
        this.timer--;
        if(this.timer < 0){
            if(this.history.length > 1) this.history.shift();
            else this.reset();
            return;
        }

        let x = ~~(this.x / this.effect.cellSize);
        let y = ~~(this.y / this.effect.cellSize);
        let index = y*this.effect.cols + x;
        let theta = this.effect.flowField[index];

        this.velocity.x = Math.cos(theta) * this.velocityBoost;
        this.velocity.y = Math.sin(theta) * this.velocityBoost;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.history.push({x: this.x, y: this.y});
        if(this.history.length > this.maxLength) this.history.shift();
    }

    reset(){
        this.x = ~~(Math.random() * this.effect.width);
        this.y = ~~(Math.random() * this.effect.height);
        this.history = [{x: this.x, y: this.y}];
        this.timer = this.maxLength * (3-this.velocityBoost)*2;
    }
}

class Effect{
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numParticles = 3000;
        this.cellSize = 10;
        this.rows = 1;
        this.cols = 1;
        this.numParticles;
        this.flowField = [];
        this.curve = 5.0;
        this.zoom = 0.05;
        this.init();
        this.isShowGrid = false;

        window.addEventListener("keydown", e =>{
            switch(e.key){
                case 'g': 
                    this.isShowGrid = !this.isShowGrid;
                    this.resize(this.width, this.height);
                    break;
                case 'p':
                    this.cellSize+=5;
                    if(this.cellSize > 100) this.cellSize = 100;
                    console.log(this.cellSize);
                    this.initflowField(this.width, this.height);
                    break;
                case 'o':
                    this.cellSize-=5;
                    if(this.cellSize < 1) this.cellSize = 1;
                    console.log(this.cellSize);
                    this.initflowField(this.width, this.height);   
                    break; 
                case 'l':
                    this.numParticles+=100;
                    if(this.numParticles > 10000) this.numParticles = 10000;
                    console.log(this.numParticles);
                    this.init();
                    break;
                case 'k':
                    this.numParticles-=100;
                    if(this.numParticles < 1) this.numParticles = 1;
                    console.log(this.numParticles);
                    this.init();
                    break;
                case 'i':
                    this.curve+=0.1;
                    if(this.curve > 10000) this.cruve = 10000;
                    console.log(this.curve);
                    this.initflowField();
                    break;
                case 'u':
                    this.curve-=0.1;
                    if(this.curve < 0) this.curve = 0.0;
                    console.log(this.curve);
                    this.initflowField();
                    break;
                case 'm':
                    this.zoom+=0.01;
                    if(this.zoom > 1.0) this.zoom = 1.0;
                    console.log(this.zoom);
                    this.initflowField();
                    break;
                case 'n':
                    this.zoom-=0.01;
                    if(this.zoom < 0) this.zoom = 0.0;
                    console.log(this.zoom);
                    this.initflowField();
                    break;
                default:
                    break;
            }

        });

        window.addEventListener("resize", e =>{ 
            this.resize(e.target.innerWidth, e.target.innerHeight)
        });
    }

    init(){
        //create flow field
        this.initflowField();

        //create particles
        this.particles = [];
        for(let i = 0; i < this.numParticles; i++){
            this.particles.push(new Particle(this, "#c563e0"));
        }
    }

    initflowField(){
        this.rows = ~~(this.height / this.cellSize);
        this.cols = ~~(this.width / this.cellSize);
        this.flowField = [];
        for(let y = 0; y < this.rows; y++){
            for(let x = 0; x < this.cols; x++){
                let angle = (Math.cos(x*this.zoom) + Math.sin(y*this.zoom)) * this.curve;
                this.flowField.push(angle);
            }
        }
    }

    render(context){
        if(this.isShowGrid) this.drawGrid(context);
        this.particles.forEach(particle =>{
            particle.draw(context);
            particle.update();
        });
    }

    drawGrid(context){
        context.save();
        context.strokeStyle = "white";
        context.lineWidth = 0.3;


        for (let c = 0; c < this.cols; c++){
            context.strokeStyle = "white";
            context.beginPath();
            context.moveTo(this.cellSize * c, 0);
            context.lineTo(this.cellSize * c, this.height);
            context.stroke();
        }
        for (let r = 0; r < this.rows; r++){
            context.strokeStyle = "white";
            context.beginPath();
            context.moveTo(0, this.cellSize * r);
            context.lineTo(this.width, this.cellSize * r);
            context.stroke();
        }
        context.restore();
    }

    resize(width, height){
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.initflowField();
    }
}

const effect = new Effect(canvas);


function animate(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    effect.render(ctx);
    requestAnimationFrame(animate);
}

animate();
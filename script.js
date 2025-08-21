const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');
const menu = document.getElementById('menu');
const difficultyDiv = document.getElementById('difficulty');

const CELL = 50;
const OFFSET = 25;

let gameMode = null; // 'human' or 'ai'
let aiLevel = 'easy';
let turn = 'red';
let pieces = [];
let selected = null;

// UI setup
const vsHumanBtn = document.getElementById('vsHuman');
const vsAIBtn = document.getElementById('vsAI');

vsHumanBtn.addEventListener('click', () => startGame('human'));
vsAIBtn.addEventListener('click', () => {
    difficultyDiv.style.display = 'block';
});

Array.from(difficultyDiv.querySelectorAll('button')).forEach(btn => {
    btn.addEventListener('click', () => {
        aiLevel = btn.dataset.level;
        startGame('ai');
    });
});

function startGame(mode) {
    gameMode = mode;
    menu.style.display = 'none';
    boardCanvas.style.display = 'block';
    initPieces();
    turn = 'red';
    drawBoard();
    drawPieces();
    boardCanvas.addEventListener('click', handleClick);
}

function initPieces() {
    pieces = [];
    // red side
    pieces.push({type:'R', side:'red', x:0, y:9});
    pieces.push({type:'N', side:'red', x:1, y:9});
    pieces.push({type:'B', side:'red', x:2, y:9});
    pieces.push({type:'A', side:'red', x:3, y:9});
    pieces.push({type:'K', side:'red', x:4, y:9});
    pieces.push({type:'A', side:'red', x:5, y:9});
    pieces.push({type:'B', side:'red', x:6, y:9});
    pieces.push({type:'N', side:'red', x:7, y:9});
    pieces.push({type:'R', side:'red', x:8, y:9});
    pieces.push({type:'C', side:'red', x:1, y:7});
    pieces.push({type:'C', side:'red', x:7, y:7});
    for (let i=0;i<5;i++) pieces.push({type:'P', side:'red', x:i*2, y:6});

    // black side
    pieces.push({type:'R', side:'black', x:0, y:0});
    pieces.push({type:'N', side:'black', x:1, y:0});
    pieces.push({type:'B', side:'black', x:2, y:0});
    pieces.push({type:'A', side:'black', x:3, y:0});
    pieces.push({type:'K', side:'black', x:4, y:0});
    pieces.push({type:'A', side:'black', x:5, y:0});
    pieces.push({type:'B', side:'black', x:6, y:0});
    pieces.push({type:'N', side:'black', x:7, y:0});
    pieces.push({type:'R', side:'black', x:8, y:0});
    pieces.push({type:'C', side:'black', x:1, y:2});
    pieces.push({type:'C', side:'black', x:7, y:2});
    for (let i=0;i<5;i++) pieces.push({type:'P', side:'black', x:i*2, y:3});
}

function drawBoard() {
    ctx.clearRect(0,0,boardCanvas.width, boardCanvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    // horizontal lines
    for (let i=0;i<10;i++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET, OFFSET + i*CELL);
        ctx.lineTo(OFFSET + 8*CELL, OFFSET + i*CELL);
        ctx.stroke();
    }
    // vertical lines
    for (let i=0;i<9;i++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET + i*CELL, OFFSET);
        if (i === 0 || i === 8) {
            ctx.lineTo(OFFSET + i*CELL, OFFSET + 9*CELL);
        } else {
            ctx.lineTo(OFFSET + i*CELL, OFFSET + 4*CELL);
            ctx.moveTo(OFFSET + i*CELL, OFFSET + 5*CELL);
            ctx.lineTo(OFFSET + i*CELL, OFFSET + 9*CELL);
        }
        ctx.stroke();
    }
    // river text
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('楚河', OFFSET + 2*CELL, OFFSET + 4.5*CELL);
    ctx.fillText('漢界', OFFSET + 6*CELL, OFFSET + 4.5*CELL);
    // palace diagonals
    ctx.beginPath();
    ctx.moveTo(OFFSET + 3*CELL, OFFSET);
    ctx.lineTo(OFFSET + 5*CELL, OFFSET + 2*CELL);
    ctx.moveTo(OFFSET + 5*CELL, OFFSET);
    ctx.lineTo(OFFSET + 3*CELL, OFFSET + 2*CELL);
    ctx.moveTo(OFFSET + 3*CELL, OFFSET + 7*CELL);
    ctx.lineTo(OFFSET + 5*CELL, OFFSET + 9*CELL);
    ctx.moveTo(OFFSET + 5*CELL, OFFSET + 7*CELL);
    ctx.lineTo(OFFSET + 3*CELL, OFFSET + 9*CELL);
    ctx.stroke();
}

function pieceAt(x,y) {
    return pieces.find(p => p.x === x && p.y === y);
}

function drawPieces() {
    pieces.forEach(p => {
        const px = OFFSET + p.x*CELL;
        const py = OFFSET + p.y*CELL;
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI*2);
        ctx.fillStyle = '#f9e4b7';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.fillStyle = p.side === 'red' ? 'red' : 'black';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pieceText(p), px, py);
    });
    if (selected) {
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.arc(OFFSET + selected.x*CELL, OFFSET + selected.y*CELL, 22, 0, Math.PI*2);
        ctx.stroke();
    }
}

function pieceText(p) {
    const mapRed = {K:'帥', A:'仕', B:'相', N:'馬', R:'車', C:'炮', P:'兵'};
    const mapBlack = {K:'將', A:'士', B:'象', N:'馬', R:'車', C:'砲', P:'卒'};
    return p.side === 'red' ? mapRed[p.type] : mapBlack[p.type];
}

function handleClick(e) {
    const rect = boardCanvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - OFFSET)/CELL);
    const y = Math.round((e.clientY - rect.top - OFFSET)/CELL);
    if (x < 0 || x > 8 || y < 0 || y > 9) return;
    const p = pieceAt(x,y);
    if (selected) {
        if (p && p.side === selected.side) {
            selected = p; // select another
        } else if (isValidMove(selected, x, y)) {
            if (movePiece(selected, x, y)) {
                selected = null;
                if (gameMode === 'ai' && turn === 'black') {
                    setTimeout(aiMove, 300);
                }
            }
        } else {
            selected = null;
        }
    } else {
        if (p && p.side === turn) {
            selected = p;
        }
    }
    drawBoard();
    drawPieces();
}

function isValidMove(piece, x, y) {
    const moves = generateMoves(piece);
    return moves.some(m => m[0] === x && m[1] === y);
}

function movePiece(piece, x, y) {
    const oldX = piece.x, oldY = piece.y;
    const target = pieceAt(x,y);
    if (target) pieces.splice(pieces.indexOf(target),1);
    piece.x = x; piece.y = y;
    if (kingsFacing()) {
        // invalid move
        piece.x = oldX; piece.y = oldY;
        if (target) pieces.push(target);
        return false;
    }
    if (target && target.type === 'K') {
        drawBoard();
        drawPieces();
        setTimeout(() => alert(piece.side === 'red' ? '紅方勝!' : '黑方勝!'), 50);
    }
    turn = turn === 'red' ? 'black' : 'red';
    return true;
}

function generateMoves(p) {
    let moves = [];
    switch(p.type) {
        case 'R':
            moves = movesR(p); break;
        case 'N':
            moves = movesN(p); break;
        case 'B':
            moves = movesB(p); break;
        case 'A':
            moves = movesA(p); break;
        case 'K':
            moves = movesK(p); break;
        case 'C':
            moves = movesC(p); break;
        case 'P':
            moves = movesP(p); break;
    }
    // filter moves causing generals to face
    return moves.filter(m => !moveLeadsToFace(p, m[0], m[1]));
}

function movesR(p) {
    const moves=[];
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(d=>{
        let nx=p.x+d[0], ny=p.y+d[1];
        while(inBoard(nx,ny)){
            const t=pieceAt(nx,ny);
            if(!t){moves.push([nx,ny]);}
            else{ if(t.side!==p.side)moves.push([nx,ny]); break;}
            nx+=d[0]; ny+=d[1];
        }
    });
    return moves;
}

function movesC(p){
    const moves=[];
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(d=>{
        let nx=p.x+d[0], ny=p.y+d[1];
        let jumped=false;
        while(inBoard(nx,ny)){
            const t=pieceAt(nx,ny);
            if(!jumped){
                if(!t){moves.push([nx,ny]);}
                else{jumped=true;}
            }else{
                if(t){ if(t.side!==p.side)moves.push([nx,ny]); break; }
            }
            nx+=d[0]; ny+=d[1];
        }
    });
    return moves;
}

function movesN(p){
    const steps=[
        {dx:1,dy:-2,block:[0,-1]},
        {dx:-1,dy:-2,block:[0,-1]},
        {dx:1,dy:2,block:[0,1]},
        {dx:-1,dy:2,block:[0,1]},
        {dx:2,dy:-1,block:[1,0]},
        {dx:2,dy:1,block:[1,0]},
        {dx:-2,dy:-1,block:[-1,0]},
        {dx:-2,dy:1,block:[-1,0]}
    ];
    const moves=[];
    steps.forEach(s=>{
        const nx=p.x+s.dx, ny=p.y+s.dy;
        const bx=p.x+s.block[0], by=p.y+s.block[1];
        if(inBoard(nx,ny) && !pieceAt(bx,by)){
            const t=pieceAt(nx,ny);
            if(!t||t.side!==p.side)moves.push([nx,ny]);
        }
    });
    return moves;
}

function movesB(p){
    const steps=[
        {dx:2,dy:2},{dx:-2,dy:2},{dx:2,dy:-2},{dx:-2,dy:-2}
    ];
    const moves=[];
    steps.forEach(s=>{
        const nx=p.x+s.dx, ny=p.y+s.dy;
        const bx=p.x+s.dx/2, by=p.y+s.dy/2;
        if(inBoard(nx,ny) && !pieceAt(bx,by)){
            if(p.side==='red' && ny>=5 || p.side==='black' && ny<=4){
                const t=pieceAt(nx,ny);
                if(!t||t.side!==p.side)moves.push([nx,ny]);
            }
        }
    });
    return moves;
}

function movesA(p){
    const steps=[{dx:1,dy:1},{dx:-1,dy:1},{dx:1,dy:-1},{dx:-1,dy:-1}];
    const moves=[];
    steps.forEach(s=>{
        const nx=p.x+s.dx, ny=p.y+s.dy;
        if(inPalace(nx,ny,p.side)){
            const t=pieceAt(nx,ny);
            if(!t||t.side!==p.side)moves.push([nx,ny]);
        }
    });
    return moves;
}

function movesK(p){
    const steps=[[1,0],[-1,0],[0,1],[0,-1]];
    const moves=[];
    steps.forEach(s=>{
        const nx=p.x+s[0], ny=p.y+s[1];
        if(inPalace(nx,ny,p.side)){
            const t=pieceAt(nx,ny);
            if(!t||t.side!==p.side)moves.push([nx,ny]);
        }
    });
    // shooting the other king
    const enemy = pieces.find(pc=>pc.type==='K' && pc.side!==p.side);
    if(p.x===enemy.x){
        let blocked=false;
        for(let y=Math.min(p.y,enemy.y)+1; y<Math.max(p.y,enemy.y); y++){
            if(pieceAt(p.x,y)){blocked=true;break;}
        }
        if(!blocked) moves.push([enemy.x, enemy.y]);
    }
    return moves;
}

function movesP(p){
    const moves=[];
    const dir=p.side==='red'? -1:1;
    let nx=p.x, ny=p.y+dir;
    if(inBoard(nx,ny)){
        const t=pieceAt(nx,ny);
        if(!t||t.side!==p.side)moves.push([nx,ny]);
    }
    if(p.side==='red' && p.y<=4 || p.side==='black' && p.y>=5){
        [[1,0],[-1,0]].forEach(d=>{
            const nx=p.x+d[0], ny=p.y+d[1];
            if(inBoard(nx,ny)){
                const t=pieceAt(nx,ny);
                if(!t||t.side!==p.side)moves.push([nx,ny]);
            }
        });
    }
    return moves;
}

function inBoard(x,y){return x>=0&&x<9&&y>=0&&y<10;}

function inPalace(x,y,side){
    if(x<3||x>5) return false;
    if(side==='red') return y>=7;
    else return y<=2;
}

function kingsFacing(){
    const r=pieces.find(p=>p.type==='K'&&p.side==='red');
    const b=pieces.find(p=>p.type==='K'&&p.side==='black');
    if(!r||!b) return false;
    if(r.x!==b.x) return false;
    for(let y=Math.min(r.y,b.y)+1;y<Math.max(r.y,b.y);y++){
        if(pieceAt(r.x,y)) return false;
    }
    return true;
}

function moveLeadsToFace(piece,x,y){
    const oldX=piece.x, oldY=piece.y;
    const target=pieceAt(x,y);
    if(target) pieces.splice(pieces.indexOf(target),1);
    piece.x=x; piece.y=y;
    const face=kingsFacing();
    piece.x=oldX; piece.y=oldY;
    if(target) pieces.push(target);
    return face;
}

function aiMove(){
    if(turn!=='black') return;
    let move;
    const moves=generateAllMoves('black');
    if(moves.length===0) return;
    if(aiLevel==='easy'){
        move=moves[Math.floor(Math.random()*moves.length)];
    }else{
        move=searchBestMove('black',2).move;
    }
    if(move){
        movePiece(pieces[move.pieceIndex], move.x, move.y);
    }
    drawBoard();
    drawPieces();
}

function generateAllMoves(side){
    const moves=[];
    pieces.forEach((p,i)=>{
        if(p.side===side){
            generateMoves(p).forEach(m=>{
                moves.push({pieceIndex:i,x:m[0],y:m[1]});
            });
        }
    });
    return moves;
}

function searchBestMove(side,depth){
    const moves=generateAllMoves(side);
    let bestMove=moves[0];
    let bestScore=side==='red'? -Infinity:Infinity;
    moves.forEach(m=>{
        const snap=saveState();
        makeMove(m);
        const score=minimax(opposite(side), depth-1, -Infinity, Infinity);
        loadState(snap);
        if(side==='red'){
            if(score>bestScore){bestScore=score; bestMove=m;}
        }else{
            if(score<bestScore){bestScore=score; bestMove=m;}
        }
    });
    return {move:bestMove,score:bestScore};
}

function minimax(side, depth, alpha, beta){
    if(depth===0) return evaluate();
    const moves=generateAllMoves(side);
    if(moves.length===0) return evaluate();
    if(side==='red'){
        let maxEval=-Infinity;
        for(const m of moves){
            const snap=saveState();
            makeMove(m);
            const evalScore=minimax('black', depth-1, alpha, beta);
            loadState(snap);
            if(evalScore>maxEval) maxEval=evalScore;
            if(evalScore>alpha) alpha=evalScore;
            if(beta<=alpha) break;
        }
        return maxEval;
    }else{
        let minEval=Infinity;
        for(const m of moves){
            const snap=saveState();
            makeMove(m);
            const evalScore=minimax('red', depth-1, alpha, beta);
            loadState(snap);
            if(evalScore<minEval) minEval=evalScore;
            if(evalScore<beta) beta=evalScore;
            if(beta<=alpha) break;
        }
        return minEval;
    }
}

function evaluate(){
    const values={K:10000,R:500,N:300,B:200,A:200,C:450,P:100};
    let score=0;
    pieces.forEach(p=>{
        let v=values[p.type];
        if(p.type==='P'){
            if(p.side==='red' && p.y<5) v=120;
            if(p.side==='black' && p.y>4) v=120;
        }
        score+=p.side==='red'? v : -v;
    });
    return score;
}

function saveState(){
    return {pieces: JSON.parse(JSON.stringify(pieces)), turn};
}

function loadState(s){
    pieces = JSON.parse(JSON.stringify(s.pieces));
    turn = s.turn;
}

function makeMove(m){
    const piece=pieces[m.pieceIndex];
    const target=pieceAt(m.x,m.y);
    if(target) pieces.splice(pieces.indexOf(target),1);
    piece.x=m.x; piece.y=m.y;
}

function opposite(side){ return side==='red' ? 'black' : 'red'; }


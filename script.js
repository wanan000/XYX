class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.won = false;
        this.moved = false;
        this.tileContainer = document.getElementById('tile-container');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameMessage = document.querySelector('.game-message');
        this.mobileControls = document.getElementById('mobile-controls');
        
        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 初始化游戏
        this.init();
        
        // 绑定事件
        this.bindEvents();
        
        // 如果是移动设备，显示控制提示
        if (this.isMobile) {
            this.showMobileControls();
        }
    }

    // 初始化游戏
    init() {
        // 清空网格和显示
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.updateScore();
        this.tileContainer.innerHTML = '';
        this.gameMessage.style.display = 'none';

        // 添加初始方块
        this.addRandomTile();
        this.addRandomTile();
    }

    // 显示移动设备控制提示
    showMobileControls() {
        if (this.mobileControls) {
            // 显示控制提示
            this.mobileControls.style.display = 'block';
            
            // 强制重排以确保过渡效果生效
            this.mobileControls.offsetHeight;
            
            // 淡入效果
            setTimeout(() => {
                this.mobileControls.style.opacity = '1';
                
                // 5秒后淡出
                setTimeout(() => {
                    this.mobileControls.style.opacity = '0';
                    
                    // 等待淡出动画完成后隐藏元素
                    setTimeout(() => {
                        this.mobileControls.style.display = 'none';
                    }, 1000);
                }, 5000);
            }, 100);
        }
    }

    // 绑定事件处理
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            let moved = false;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    moved = this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    moved = this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    moved = this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    moved = this.move('right');
                    break;
            }

            if (moved) {
                this.addRandomTile();
                this.checkGameStatus();
            }
        });

        // 触摸事件处理
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const gameContainer = document.querySelector('.game-container');

        // 游戏容器获得焦点时阻止页面滚动
        gameContainer.addEventListener('touchstart', (e) => {
            // 记录开始位置和时间
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            
            // 在移动设备上，当游戏开始时阻止页面滚动
            if (this.isMobile) {
                document.body.classList.add('playing');
            }
        }, { passive: false });

        gameContainer.addEventListener('touchmove', (e) => {
            // 仅在游戏容器内阻止默认滚动行为
            e.preventDefault();
        }, { passive: false });

        gameContainer.addEventListener('touchend', (e) => {
            // 移除playing类，恢复页面滚动
            if (this.isMobile) {
                document.body.classList.remove('playing');
            }
            
            if (this.gameOver) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const duration = touchEndTime - touchStartTime;
            
            // 忽略过短的触摸（可能是点击）或过长的触摸（可能是滚动尝试）
            if (duration < 50 || duration > 500) return;
            
            // 忽略过小的移动（可能是意外触摸）
            const minSwipeDistance = 30;
            if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;
            
            let moved = false;
            
            // 确定滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) {
                    moved = this.move('right');
                } else {
                    moved = this.move('left');
                }
            } else {
                if (dy > 0) {
                    moved = this.move('down');
                } else {
                    moved = this.move('up');
                }
            }

            if (moved) {
                this.addRandomTile();
                this.checkGameStatus();
            }
        });

        // 新游戏按钮
        document.getElementById('restart').addEventListener('click', () => {
            this.init();
        });

        // 重试按钮
        document.querySelector('.retry-button').addEventListener('click', () => {
            this.init();
        });
    }

    // 添加随机方块
    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[x][y] = value;
            this.addTile(x, y, value, true);
        }
    }

    // 添加方块到DOM
    addTile(x, y, value, isNew = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}${isNew ? ' tile-new' : ''}`;
        tile.textContent = value;
        tile.style.left = (y * (106.25 + 15)) + 'px';
        tile.style.top = (x * (106.25 + 15)) + 'px';
        this.tileContainer.appendChild(tile);
    }

    // 移动方块
    move(direction) {
        let moved = false;
        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);

        // 清除所有方块的DOM
        this.tileContainer.innerHTML = '';

        // 创建新网格用于移动
        let newGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                let cell = {x: x, y: y};
                let value = this.grid[x][y];

                if (value !== 0) {
                    let positions = this.findFarthestPosition(cell, vector);
                    let next = this.grid[positions.next.x][positions.next.y];

                    if (next === value && !positions.merged) {
                        // 合并
                        let mergedValue = value * 2;
                        newGrid[positions.next.x][positions.next.y] = mergedValue;
                        this.score += mergedValue;
                        this.addTile(positions.next.x, positions.next.y, mergedValue);
                        positions.merged = true;
                        moved = true;

                        // 检查是否达到2048
                        if (mergedValue === 2048 && !this.won) {
                            this.won = true;
                        }
                    } else {
                        // 移动或保持原位
                        newGrid[positions.farthest.x][positions.farthest.y] = value;
                        this.addTile(positions.farthest.x, positions.farthest.y, value);
                        moved = (x !== positions.farthest.x || y !== positions.farthest.y);
                    }
                }
            });
        });

        if (moved) {
            this.grid = newGrid;
            this.updateScore();
        }

        return moved;
    }

    // 获取移动方向向量
    getVector(direction) {
        const vectors = {
            'up': {x: -1, y: 0},
            'right': {x: 0, y: 1},
            'down': {x: 1, y: 0},
            'left': {x: 0, y: -1}
        };
        return vectors[direction];
    }

    // 构建遍历顺序
    buildTraversals(vector) {
        let traversals = {
            x: Array(this.gridSize).fill().map((_, i) => i),
            y: Array(this.gridSize).fill().map((_, i) => i)
        };

        if (vector.x === 1) traversals.x.reverse();
        if (vector.y === 1) traversals.y.reverse();

        return traversals;
    }

    // 找到最远的可移动位置
    findFarthestPosition(cell, vector) {
        let previous;
        let merged = false;

        do {
            previous = cell;
            cell = {
                x: previous.x + vector.x,
                y: previous.y + vector.y
            };
        } while (this.withinBounds(cell) && this.grid[cell.x][cell.y] === 0);

        if (this.withinBounds(cell) && !merged) {
            merged = true;
        } else {
            cell = previous;
        }

        return {
            farthest: previous,
            next: cell,
            merged: false
        };
    }

    // 检查是否在边界内
    withinBounds(position) {
        return position.x >= 0 && position.x < this.gridSize &&
               position.y >= 0 && position.y < this.gridSize;
    }

    // 更新分数显示
    updateScore() {
        this.scoreDisplay.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreDisplay.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    // 检查游戏状态
    checkGameStatus() {
        if (this.won) {
            this.gameMessage.innerHTML = '<p>你赢了!</p>';
            this.gameMessage.className = 'game-message game-won';
            this.gameMessage.style.display = 'flex';
            this.gameOver = true;
            return;
        }

        // 检查是否还有空格
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return;
            }
        }

        // 检查是否还有可以合并的方块
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                const directions = [{x: 0, y: 1}, {x: 1, y: 0}];

                for (let direction of directions) {
                    const newX = i + direction.x;
                    const newY = j + direction.y;

                    if (newX < this.gridSize && newY < this.gridSize) {
                        if (current === this.grid[newX][newY]) return;
                    }
                }
            }
        }

        // 如果没有可移动的方块，游戏结束
        this.gameMessage.innerHTML = '<p>游戏结束!</p>';
        this.gameMessage.className = 'game-message game-over';
        this.gameMessage.style.display = 'flex';
        this.gameOver = true;
    }
}

// 启动游戏
window.onload = () => {
    new Game2048();
};
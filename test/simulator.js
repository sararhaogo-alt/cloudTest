/**
 * simulator.js (확장 버전)
 * Route 53, CloudFront, WAF, ElastiCache, Multi-AZ RDS 및 DDoS 공격 시뮬레이션을 지원하는 Canvas 렌더러
 */

class CloudArchitectureSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.animationFrameId = null;

    // 현재 상태
    this.archType = 'single';
    this.users = 50;
    this.storageGB = 15;
    this.ec2Count = 1;

    // 파워 툴킷 옵션들
    this.options = {
      enableCloudFront: false,
      enableElastiCache: false,
      enableWAF: false,
      enableMultiAZ: false,
      isUnderDDoS: false
    };

    // 파티클 풀
    this.packets = [];
    this.blockedSparks = []; // WAF 차단 스파크 파티클
    this.maxPackets = 85;
    this.lastPacketSpawnTime = 0;

    // 노드 위치
    this.nodes = {};
    this.hoveredNode = null;
    this.pulseAngle = 0;

    // 콜백
    this.onNodeClick = null;

    this.initCanvasSize();
    this.bindEvents();
    this.updateNodes();
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(500, Math.min(640, window.innerHeight * 0.56));

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.updateNodes();
      if (!this.isRunning) this.drawStatic();
    });

    const getCanvasMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasMousePos(e);
      let found = null;
      for (const [key, node] of Object.entries(this.nodes)) {
        if (!node.visible) continue;
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius) {
          found = key;
          break;
        }
      }

      if (this.hoveredNode !== found) {
        this.hoveredNode = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';
        if (!this.isRunning) this.drawStatic();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode && this.onNodeClick) {
        const serviceKey = this.nodes[this.hoveredNode]?.serviceId;
        if (serviceKey) {
          this.onNodeClick(serviceKey);
        }
      }
    });
  }

  setArchitecture(archType, users, storageGB, ec2Count, options = {}) {
    this.archType = archType;
    this.users = users;
    this.storageGB = storageGB;
    this.ec2Count = ec2Count;
    this.options = { ...this.options, ...options };

    this.packets = [];
    this.blockedSparks = [];
    this.updateNodes();

    if (!this.isRunning) {
      this.drawStatic();
    }
  }

  updateNodes() {
    const W = this.width;
    const H = this.height;

    // VPC 사설 네트워크 경계
    this.vpcRect = {
      x: W * 0.30,
      y: H * 0.12,
      w: W * 0.66,
      h: H * 0.82
    };

    // Public / Private 서브넷
    this.publicSubnetRect = {
      x: this.vpcRect.x + 14,
      y: this.vpcRect.y + 36,
      w: this.vpcRect.w * 0.31,
      h: this.vpcRect.h - 48
    };

    this.privateSubnetRect = {
      x: this.publicSubnetRect.x + this.publicSubnetRect.w + 16,
      y: this.vpcRect.y + 36,
      w: this.vpcRect.w - this.publicSubnetRect.w - 36,
      h: this.vpcRect.h - 48
    };

    // 노드 맵 구축
    this.nodes = {
      // 1. 유저
      users: {
        id: 'users',
        name: '글로벌 유저',
        subText: `${this.users.toLocaleString()}명 접속`,
        icon: '👥',
        color: '#60A5FA',
        serviceId: null,
        x: W * 0.065,
        y: H * 0.5,
        radius: 30,
        visible: true
      },
      // 2. Route 53 (DNS)
      route53: {
        id: 'route53',
        name: 'Route 53',
        subText: 'DNS 주소록',
        icon: '🌐',
        color: '#8C4FFF',
        serviceId: 'route53',
        x: W * 0.165,
        y: H * 0.32,
        radius: 24,
        visible: true
      },
      // 3. AWS WAF (웹 방화벽)
      waf: {
        id: 'waf',
        name: 'AWS WAF',
        subText: this.options.enableWAF ? '방패 활성화' : '미사용',
        icon: '🛡️',
        color: this.options.enableWAF ? '#DD344C' : '#64748B',
        serviceId: 'waf',
        x: W * 0.165,
        y: H * 0.68,
        radius: 24,
        visible: true
      },
      // 4. CloudFront (CDN)
      cloudfront: {
        id: 'cloudfront',
        name: 'CloudFront',
        subText: this.options.enableCloudFront ? '엣지 캐시 가동' : '미사용',
        icon: '⚡',
        color: this.options.enableCloudFront ? '#8C4FFF' : '#64748B',
        serviceId: 'cloudfront',
        x: W * 0.265,
        y: H * 0.22,
        radius: 25,
        visible: this.options.enableCloudFront
      },
      // 5. 인터넷 게이트웨이 (IGW)
      igw: {
        id: 'igw',
        name: '인터넷 게이트웨이',
        subText: 'VPC 출입구',
        icon: '🚪',
        color: '#818CF8',
        serviceId: 'vpc',
        x: this.vpcRect.x,
        y: H * 0.5,
        radius: 20,
        visible: true
      },
      // 6. ALB (로드밸런서)
      alb: {
        id: 'alb',
        name: 'ALB 로드밸런서',
        subText: '트래픽 분산',
        icon: '⚖️',
        color: '#00A4A6',
        serviceId: 'alb',
        x: this.publicSubnetRect.x + this.publicSubnetRect.w * 0.5,
        y: H * 0.5,
        radius: 30,
        visible: this.archType === 'loadbalancer'
      },
      // 7. ElastiCache (Redis 인메모리 캐시)
      elasticache: {
        id: 'elasticache',
        name: 'ElastiCache',
        subText: 'Redis RAM 캐시',
        icon: '🚀',
        color: '#C925D1',
        serviceId: 'elasticache',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.52,
        y: H * 0.5,
        radius: 26,
        visible: this.options.enableElastiCache
      },
      // 8. Amazon S3
      s3: {
        id: 's3',
        name: 'Amazon S3',
        subText: `${this.formatStorage(this.storageGB)}`,
        icon: '🪣',
        color: '#10B981',
        serviceId: 's3',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.82,
        y: H * 0.24,
        radius: 30,
        visible: true
      },
      // 9. Amazon RDS (Primary)
      rds: {
        id: 'rds',
        name: this.options.enableMultiAZ ? 'RDS (Primary)' : 'Amazon RDS',
        subText: '메인 데이터베이스',
        icon: '🗄️',
        color: '#3B82F6',
        serviceId: 'rds',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.82,
        y: this.options.enableMultiAZ ? H * 0.65 : H * 0.76,
        radius: 30,
        visible: true
      },
      // 10. Multi-AZ Standby RDS Replica
      rds_standby: {
        id: 'rds_standby',
        name: 'RDS (Standby)',
        subText: 'Multi-AZ 복제본',
        icon: '🗄️',
        color: '#60A5FA',
        serviceId: 'rds',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.82,
        y: H * 0.86,
        radius: 22,
        visible: this.options.enableMultiAZ
      },
      // 11. CloudWatch 관제탑
      cloudwatch: {
        id: 'cloudwatch',
        name: 'CloudWatch',
        subText: '실시간 관제',
        icon: '📈',
        color: '#E05344',
        serviceId: 'cloudwatch',
        x: W * 0.92,
        y: H * 0.12,
        radius: 22,
        visible: true
      }
    };

    // 컴퓨팅 레이어
    if (this.archType === 'single') {
      this.nodes.ec2_1 = {
        id: 'ec2_1',
        name: 'Amazon EC2',
        subText: '단일 가상 서버',
        icon: '💻',
        color: '#FF9900',
        serviceId: 'ec2',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.24,
        y: H * 0.5,
        radius: 32,
        visible: true
      };
    } else if (this.archType === 'loadbalancer') {
      const count = Math.min(6, Math.max(2, this.ec2Count));
      const startY = H * 0.25;
      const endY = H * 0.75;
      const stepY = (endY - startY) / (count - 1);

      this.asgNodes = [];
      for (let i = 0; i < count; i++) {
        const key = `ec2_${i + 1}`;
        this.nodes[key] = {
          id: key,
          name: `EC2 #${i + 1}`,
          subText: 'Auto Scaling',
          icon: '💻',
          color: '#FF9900',
          serviceId: 'ec2',
          x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.24,
          y: startY + stepY * i,
          radius: 22,
          visible: true
        };
        this.asgNodes.push(key);
      }
    } else if (this.archType === 'serverless') {
      this.nodes.lambda = {
        id: 'lambda',
        name: 'AWS Lambda',
        subText: '서버리스 함수 군집',
        icon: '⚡',
        color: '#ED7100',
        serviceId: 'lambda',
        x: this.privateSubnetRect.x + this.privateSubnetRect.w * 0.24,
        y: H * 0.60,
        radius: 32,
        visible: true
      };
    }
  }

  formatStorage(gb) {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb} GB`;
  }

  startSimulation() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastPacketSpawnTime = performance.now();
    this.animate();
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.packets = [];
    this.blockedSparks = [];
    this.drawStatic();
  }

  toggleSimulation() {
    if (this.isRunning) {
      this.stopSimulation();
      return false;
    } else {
      this.startSimulation();
      return true;
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.pulseAngle += 0.05;
    this.updatePackets();
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  drawStatic() {
    this.render();
  }

  updatePackets() {
    const now = performance.now();

    // 트래픽 규모에 따른 패킷 생성 주기
    let spawnInterval = 300;
    if (this.users > 60000) spawnInterval = 65;
    else if (this.users > 15000) spawnInterval = 110;
    else if (this.users > 1000) spawnInterval = 180;

    if (this.options.isUnderDDoS) {
      spawnInterval = Math.min(spawnInterval, 50); // 디도스 시 폭발적 발사
    }

    if (now - this.lastPacketSpawnTime > spawnInterval && this.packets.length < this.maxPackets) {
      this.spawnPacket();
      this.lastPacketSpawnTime = now;
    }

    // 패킷 위치 이동
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        p.stageIndex++;

        // WAF 차단 처리 (악성 패킷인데 WAF 노드에 도달했을 때)
        if (p.isDDoS && this.options.enableWAF && p.path[p.stageIndex]?.id === 'waf') {
          // 차단 스파크 파티클 생성
          this.createBlockedSparks(p.path[p.stageIndex].x, p.path[p.stageIndex].y);
          this.packets.splice(i, 1);
          continue;
        }

        if (p.stageIndex >= p.path.length - 1) {
          this.packets.splice(i, 1);
          continue;
        } else {
          p.progress = 0;
        }
      }
    }

    // 스파크 파티클 수명 관리
    for (let i = this.blockedSparks.length - 1; i >= 0; i--) {
      const s = this.blockedSparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.05;
      if (s.life <= 0) {
        this.blockedSparks.splice(i, 1);
      }
    }
  }

  createBlockedSparks(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.blockedSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: '#EF4444'
      });
    }
  }

  spawnPacket() {
    const isDDoS = this.options.isUnderDDoS && Math.random() < 0.65;
    const pathNodes = [];

    pathNodes.push(this.nodes.users);

    // 디도스 공격 패킷인 경우
    if (isDDoS) {
      pathNodes.push(this.nodes.waf);
      if (!this.options.enableWAF) {
        // WAF가 꺼져 있으면 서버로 침투!
        pathNodes.push(this.nodes.igw);
        if (this.archType === 'single') pathNodes.push(this.nodes.ec2_1);
        else if (this.archType === 'loadbalancer') pathNodes.push(this.nodes.alb);
        else if (this.archType === 'serverless') pathNodes.push(this.nodes.lambda);
      }
    } else {
      // 일반 사용자 정상 패킷
      pathNodes.push(this.nodes.route53);

      // CloudFront 엣지 캐시 히트 (정적 리소스)
      if (this.options.enableCloudFront && Math.random() < 0.45) {
        pathNodes.push(this.nodes.cloudfront);
        pathNodes.push(this.nodes.users); // 캐시 히트되어 즉시 유저에게 리턴!
      } else {
        pathNodes.push(this.nodes.igw);

        if (this.archType === 'single') {
          pathNodes.push(this.nodes.ec2_1);
          // ElastiCache 캐시 히트 여부
          if (this.options.enableElastiCache && Math.random() < 0.6) {
            pathNodes.push(this.nodes.elasticache);
          } else {
            if (Math.random() < 0.65) pathNodes.push(this.nodes.rds);
            else pathNodes.push(this.nodes.s3);
          }
        } else if (this.archType === 'loadbalancer') {
          pathNodes.push(this.nodes.alb);
          if (this.asgNodes && this.asgNodes.length > 0) {
            const chosen = this.nodes[this.asgNodes[Math.floor(Math.random() * this.asgNodes.length)]];
            pathNodes.push(chosen);
          }
          if (this.options.enableElastiCache && Math.random() < 0.6) {
            pathNodes.push(this.nodes.elasticache);
          } else {
            if (Math.random() < 0.65) pathNodes.push(this.nodes.rds);
            else pathNodes.push(this.nodes.s3);
          }
        } else if (this.archType === 'serverless') {
          if (Math.random() < 0.5) {
            pathNodes.push(this.nodes.s3);
          } else {
            pathNodes.push(this.nodes.lambda);
            pathNodes.push(this.nodes.rds);
          }
        }
      }
    }

    const normalColors = ['#38BDF8', '#4ADE80', '#FBBF24', '#A78BFA'];
    const pColor = isDDoS ? '#EF4444' : normalColors[Math.floor(Math.random() * normalColors.length)];

    let speed = isDDoS ? 0.024 : 0.019;
    if (this.archType === 'single' && this.users > 3000 && !isDDoS) {
      speed = 0.007; // 병목 지연
    }

    this.packets.push({
      path: pathNodes,
      stageIndex: 0,
      progress: 0,
      speed: speed + Math.random() * 0.004,
      color: pColor,
      size: isDDoS ? 5.5 : 4.5,
      isDDoS
    });
  }

  render() {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    ctx.clearRect(0, 0, W, H);

    this.drawTechGrid(ctx, W, H);
    this.drawNetworkBoundaries(ctx);
    this.drawConnections(ctx);
    this.drawNodes(ctx);

    if (this.isRunning) {
      this.drawPackets(ctx);
      this.drawSparks(ctx);
    }
  }

  drawTechGrid(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 32;

    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNetworkBoundaries(ctx) {
    ctx.save();
    const v = this.vpcRect;

    // Amazon VPC 경계선
    ctx.strokeStyle = '#8C4FFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.fillStyle = 'rgba(140, 79, 255, 0.035)';
    this.roundRect(ctx, v.x, v.y, v.w, v.h, 16, true, true);

    // VPC 뱃지
    ctx.setLineDash([]);
    ctx.fillStyle = '#8C4FFF';
    this.roundRect(ctx, v.x + 16, v.y - 12, 210, 24, 6, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰 Amazon VPC (10.0.0.0/16)', v.x + 121, v.y);

    // 퍼블릭 서브넷
    const pub = this.publicSubnetRect;
    ctx.strokeStyle = 'rgba(0, 164, 166, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.fillStyle = 'rgba(0, 164, 166, 0.035)';
    this.roundRect(ctx, pub.x, pub.y, pub.w, pub.h, 12, true, true);

    ctx.fillStyle = 'rgba(0, 164, 166, 0.9)';
    ctx.setLineDash([]);
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌐 퍼블릭 서브넷 (DMZ)', pub.x + 12, pub.y + 18);

    // 프라이빗 서브넷
    const priv = this.privateSubnetRect;
    ctx.strokeStyle = 'rgba(255, 153, 0, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.fillStyle = 'rgba(255, 153, 0, 0.03)';
    this.roundRect(ctx, priv.x, priv.y, priv.w, priv.h, 12, true, true);

    ctx.fillStyle = 'rgba(255, 153, 0, 0.9)';
    ctx.setLineDash([]);
    ctx.font = '11px sans-serif';
    ctx.fillText('🔒 프라이빗 서브넷 (내부 보안 구역)', priv.x + 12, priv.y + 18);

    // 로드밸런서 모드 ASG 테두리
    if (this.archType === 'loadbalancer' && this.asgNodes && this.asgNodes.length > 0) {
      const first = this.nodes[this.asgNodes[0]];
      const last = this.nodes[this.asgNodes[this.asgNodes.length - 1]];
      const asgX = first.x - 34;
      const asgY = first.y - 30;
      const asgW = 68;
      const asgH = last.y - first.y + 60;

      ctx.strokeStyle = 'rgba(255, 153, 0, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.fillStyle = 'rgba(255, 153, 0, 0.06)';
      this.roundRect(ctx, asgX, asgY, asgW, asgH, 10, true, true);

      ctx.setLineDash([]);
      ctx.fillStyle = '#FF9900';
      this.roundRect(ctx, asgX + 2, asgY - 9, 64, 18, 4, true, false);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Auto Scaling', asgX + 34, asgY);
    }

    ctx.restore();
  }

  drawConnections(ctx) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';

    // 1. 유저 -> Route 53
    this.drawLine(ctx, this.nodes.users, this.nodes.route53);

    // 2. 유저 -> WAF
    this.drawLine(ctx, this.nodes.users, this.nodes.waf, 'rgba(221, 52, 76, 0.35)');

    // 3. Route 53 -> CloudFront (켜져 있을 때)
    if (this.options.enableCloudFront) {
      this.drawLine(ctx, this.nodes.route53, this.nodes.cloudfront);
      this.drawLine(ctx, this.nodes.cloudfront, this.nodes.igw);
    } else {
      this.drawLine(ctx, this.nodes.route53, this.nodes.igw);
    }

    // 4. WAF -> IGW
    this.drawLine(ctx, this.nodes.waf, this.nodes.igw, 'rgba(221, 52, 76, 0.25)');

    if (this.archType === 'single') {
      this.drawLine(ctx, this.nodes.igw, this.nodes.ec2_1);
      if (this.options.enableElastiCache) {
        this.drawLine(ctx, this.nodes.ec2_1, this.nodes.elasticache, '#C925D1');
        this.drawLine(ctx, this.nodes.elasticache, this.nodes.rds);
      } else {
        this.drawLine(ctx, this.nodes.ec2_1, this.nodes.rds);
      }
      this.drawLine(ctx, this.nodes.ec2_1, this.nodes.s3);
    } else if (this.archType === 'loadbalancer') {
      this.drawLine(ctx, this.nodes.igw, this.nodes.alb);

      if (this.asgNodes) {
        this.asgNodes.forEach(nodeKey => {
          const ec2 = this.nodes[nodeKey];
          this.drawLine(ctx, this.nodes.alb, ec2);
          if (this.options.enableElastiCache) {
            this.drawLine(ctx, ec2, this.nodes.elasticache, 'rgba(201, 37, 209, 0.25)');
          } else {
            this.drawLine(ctx, ec2, this.nodes.rds, 'rgba(148, 163, 184, 0.18)');
          }
          this.drawLine(ctx, ec2, this.nodes.s3, 'rgba(148, 163, 184, 0.18)');
        });
        if (this.options.enableElastiCache) {
          this.drawLine(ctx, this.nodes.elasticache, this.nodes.rds);
        }
      }
    } else if (this.archType === 'serverless') {
      this.drawLine(ctx, this.nodes.igw, this.nodes.s3);
      this.drawLine(ctx, this.nodes.igw, this.nodes.lambda);
      this.drawLine(ctx, this.nodes.lambda, this.nodes.rds);
      this.drawLine(ctx, this.nodes.lambda, this.nodes.s3, 'rgba(16, 185, 129, 0.25)');
    }

    // RDS Multi-AZ 복제선 (동기 복제)
    if (this.options.enableMultiAZ && this.nodes.rds_standby) {
      ctx.setLineDash([4, 4]);
      this.drawLine(ctx, this.nodes.rds, this.nodes.rds_standby, 'rgba(96, 165, 250, 0.6)');
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawLine(ctx, fromNode, toNode, customColor) {
    if (!fromNode || !toNode || !fromNode.visible || !toNode.visible) return;
    ctx.save();
    if (customColor) ctx.strokeStyle = customColor;

    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    const midX = (fromNode.x + toNode.x) / 2;
    ctx.bezierCurveTo(midX, fromNode.y, midX, toNode.y, toNode.x, toNode.y);
    ctx.stroke();
    ctx.restore();
  }

  drawNodes(ctx) {
    for (const [key, node] of Object.entries(this.nodes)) {
      if (!node.visible) continue;
      this.drawSingleNode(ctx, node, key === this.hoveredNode);
    }
  }

  drawSingleNode(ctx, node, isHovered) {
    ctx.save();
    const scale = isHovered ? 1.08 : 1.0;
    const r = node.radius * scale;

    ctx.shadowBlur = isHovered ? 22 : 12;
    ctx.shadowColor = node.color;

    // 그라디언트 배경
    const grad = ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, r);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.strokeStyle = node.color;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 이모지
    ctx.font = `${Math.round(r * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.icon, node.x, node.y - 1);

    // 라벨
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, node.x, node.y + r + 14);

    if (node.subText) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9.5px sans-serif';
      ctx.fillText(node.subText, node.x, node.y + r + 26);
    }

    // 과부하 경고
    if (node.id === 'ec2_1' && this.users > 3000) {
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('🔥 과부하!', node.x, node.y - r - 6);
    }

    // WAF 방패 펄스 효과
    if (node.id === 'waf' && this.options.enableWAF) {
      ctx.strokeStyle = 'rgba(221, 52, 76, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4 + Math.sin(this.pulseAngle) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawPackets(ctx) {
    ctx.save();
    for (const p of this.packets) {
      const from = p.path[p.stageIndex];
      const to = p.path[p.stageIndex + 1];
      if (!from || !to) continue;

      const t = p.progress;
      const midX = (from.x + to.x) / 2;

      const p0 = { x: from.x, y: from.y };
      const p1 = { x: midX, y: from.y };
      const p2 = { x: midX, y: to.y };
      const p3 = { x: to.x, y: to.y };

      const cx = 3 * (p1.x - p0.x);
      const bx = 3 * (p2.x - p1.x) - cx;
      const ax = p3.x - p0.x - cx - bx;

      const cy = 3 * (p1.y - p0.y);
      const by = 3 * (p2.y - p1.y) - cy;
      const ay = p3.y - p0.y - cy - by;

      const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
      const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // 디도스 패킷 경고 꼬리
      if (p.isDDoS) {
        ctx.beginPath();
        ctx.arc(x - (ax * t) * 0.08, y - (ay * t) * 0.08, p.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawSparks(ctx) {
    ctx.save();
    for (const s of this.blockedSparks) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}

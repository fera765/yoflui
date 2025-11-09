const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
      
      {/* 浮动光点 */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-primary-glow/30 rounded-full blur-lg animate-glow"></div>
      
      {/* 主要内容 */}
      <div className="relative z-10 text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 animate-float">
            Hello
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-float" style={{animationDelay: '0.2s'}}>
            World
          </h2>
        </div>
        
        <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
          <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            欢迎来到这个美丽的世界
          </p>
          <p className="text-lg md:text-xl text-muted-foreground/60 max-w-xl mx-auto">
            一个充满可能性的开始
          </p>
        </div>
        
        {/* 装饰性代码块 */}
        <div className="mt-12 animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="inline-block bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6 py-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <code className="text-primary font-mono text-sm">
              <span className="text-accent">console</span>
              <span className="text-muted-foreground">.</span>
              <span className="text-primary">log</span>
              <span className="text-muted-foreground">(</span>
              <span className="text-green-400">"Hello, World!"</span>
              <span className="text-muted-foreground">);</span>
            </code>
          </div>
        </div>
        
        {/* 底部装饰 */}
        <div className="mt-16 animate-fade-in" style={{animationDelay: '0.8s'}}>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-primary-glow rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
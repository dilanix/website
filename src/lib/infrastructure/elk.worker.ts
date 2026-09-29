// ELK's worker script: loaded inside a Web Worker it installs its own
// message dispatcher (`self.onmessage`), which `elk-api` talks to. Keeps
// layout of large graphs off the UI thread.
import "elkjs/lib/elk-worker.min.js";

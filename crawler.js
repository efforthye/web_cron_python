const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');
const WebSocket = require('ws');
const cron = require('node-cron');

const webSocketServer = new WebSocket.Server({ port: 8080 });

try {
  console.log('하이');
  webSocketServer.on('connection', function connection(ws, request) {
    console.log('WebSocket 연결됨');

    // 1) 연결 클라이언트 IP 취득
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log(`새로운 클라이언트[${ip}] 접속`);

    // 2) 클라이언트에게 메시지 전송
    if(ws.readyState === ws.OPEN){ // 연결 여부 체크
      ws.send(`클라이언트[${ip}] 접속을 환영합니다 from 서버`); // 데이터 전송
    }

    // 클라이언트로부터 메시지를 수신하는 부분
    ws.on('message', function incoming(message) {
      console.log('수신한 메시지: %s', message);
      ws.send(message.toString());
      // 클라이언트로부터 메시지를 다시 전송하거나 원하는 동작을 수행할 수 있습니다.
    });

    // 주기적으로 데이터 전송 (cron 작업)
    let count = 0;
    cron.schedule('*/5 * * * * *', function() {
      count++;
      // 여기에 cron 작업을 수행하고 데이터를 가져온 후
      // WebSocket을 통해 클라이언트에 데이터 전송
      const data = `New data from cron job (${count})`;
      ws.send(data);
      console.log(data);
    });
  });
} catch (error) {
  console.log({error});
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let prevPostCount = null;
let prevCommentCount = null;

async function fetchCounts(gallogName) {
  const urlPost = `https://gallog.dcinside.com/${gallogName}`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
  };

  try {
    const responsePost = await axios.get(urlPost, { headers });
    const $ = cheerio.load(responsePost.data);

    // 게시글 수 가져오기
    const postCountElement = $('h2.tit').first();
    let postCount;
    if (postCountElement.length > 0) {
      const postCountText = postCountElement.text().trim();
      postCount = postCountText.split("(").pop().split(")")[0];
    } else {
      postCount = "게시글 엘리먼트를 찾을 수 없습니다.";
    }

    // 댓글 수 가져오기
    const commentCountElement = $('.cont_head.clear').eq(1);
    let commentCount;
    if (commentCountElement.length > 0) {
      const commentCountText = commentCountElement.text().trim();
      commentCount = commentCountText.split("(").pop().split(")")[0];
    } else {
      commentCount = "댓글 엘리먼트를 찾을 수 없습니다.";
    }

    // 이전 값과 비교하여 변경된 경우 로그 출력
    if (prevPostCount !== null && prevCommentCount !== null) {
      if (prevPostCount !== postCount || prevCommentCount !== commentCount) {
        if(prevPostCount!==postCount && prevCommentCount !== commentCount){
            console.log(`게시글이 ${prevPostCount}개에서 ${postCount}개로 변경되었고, 댓글이 ${prevCommentCount}개에서 ${commentCount}개로 변경되었습니다.`);
        }else if(prevPostCount!==postCount){
            const newPrevPostCount = +(prevPostCount.replace(/,/g, ''));
            const newPostCount = +(postCount.replace(/,/g, ''));
            if(newPrevPostCount<newPostCount) console.log(`게시글을 ${newPostCount-newPrevPostCount}개 작성하였습니다.`);
            if(newPrevPostCount>newPostCount) console.log(`게시글을 ${newPrevPostCount-newPostCount}개 삭제하였습니다.`);
        }else if(prevCommentCount !== commentCount){
            const newPrevCommentCount = +(prevCommentCount.replace(/,/g, ''));
            const newCommentCount = +(commentCount.replace(/,/g, ''));
            if(newPrevCommentCount<newCommentCount) console.log(`댓글을 ${newCommentCount-newPrevCommentCount}개 작성하였습니다.`);
            if(newPrevCommentCount>newCommentCount) console.log(`댓글을 ${newPrevCommentCount-newCommentCount}개 삭제하였습니다.`);
        }
      }
    }

    // 현재 게시글과 댓글 개수 출력
    console.log(`[${gallogName}] 게시글 개수: ${postCount}개, 댓글 개수: ${commentCount}개`);

    // 변경된 정보 업데이트
    prevPostCount = postCount;
    prevCommentCount = commentCount;
  } catch (error) {
    console.log("게시글 및 댓글 수를 가져오는 도중 오류가 발생했습니다:", error.message);
  }
}

rl.question('게시글과 댓글을 확인할 갤러의 아이디를 입력해 주세요: ', (gallogName) => {
  rl.close();
  const interval = setInterval(() => {
    fetchCounts(gallogName);
  }, 10000); // 10초마다 실행

  // 종료 시 처리
  rl.on('close', () => {
    clearInterval(interval);
    console.log('프로그램을 종료합니다.');
    process.exit(0);
  });
});

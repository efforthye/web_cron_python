const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

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

    // 현재 게시글과 댓글 개수 출력
    console.log(`게시글 개수: ${postCount}개, 댓글 개수: ${commentCount}개`);

    // 이전 값과 비교하여 변경된 경우 로그 출력
    if (prevPostCount !== null && prevCommentCount !== null) {
      if (prevPostCount !== postCount || prevCommentCount !== commentCount) {
        if(prevPostCount!==postCount && prevCommentCount !== commentCount){
            console.log(`게시글이 ${prevPostCount}개에서 ${postCount}개로 변경되었고, 댓글이 ${prevCommentCount}개에서 ${commentCount}개로 변경되었습니다.`);
        }else if(prevPostCount!==postCount){
            if(prevPostCount<postCount) console.log(`게시글을 ${postCount-prevPostCount}개 작성하였습니다.`);
            if(prevPostCount>postCount) console.log(`게시글을 ${prevPostCount-postCount}개 삭제하였습니다.`);
            // console.log(`게시글이 ${prevPostCount}개에서 ${postCount}개로 변경되었습니다.`);
        }else if(prevCommentCount !== commentCount){
            if(prevCommentCount<commentCount) console.log(`댓글을 ${commentCount-prevCommentCount}개 작성하였습니다.`);
            if(prevCommentCount>commentCount) console.log(`댓글을 ${prevCommentCount-commentCount}개 삭제하였습니다.`);
            // console.log(`댓글이 ${prevCommentCount}개에서 ${commentCount}개로 변경되었습니다.`);
        }
      }
    }

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
  }, 5000); // 5초마다 실행

  // 종료 시 처리
  rl.on('close', () => {
    clearInterval(interval);
    console.log('프로그램을 종료합니다.');
    process.exit(0);
  });
});

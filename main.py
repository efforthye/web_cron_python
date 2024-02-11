import requests
from bs4 import BeautifulSoup
import time

def fetch_counts(gallog_name):
    url_post = f"https://gallog.dcinside.com/{gallog_name}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }

    try:
        # 게시글 수 가져오기
        response_post = requests.get(url_post, headers=headers)
        soup_post = BeautifulSoup(response_post.content, "html.parser")
        post_count_element = soup_post.select_one("h2.tit")
        if post_count_element:
            post_count_text = post_count_element.text.strip()
            post_count = post_count_text.split("(")[-1].split(")")[0]
        else:
            post_count = "게시글 엘리먼트를 찾을 수 없습니다."

        # 댓글 수 가져오기
        comment_count_element = soup_post.select('.cont_head.clear')[1]
        if comment_count_element:
            comment_count_text = comment_count_element.text.strip()
            comment_count = comment_count_text.split("(")[-1].split(")")[0]
        else:
            comment_count = "댓글 엘리먼트를 찾을 수 없습니다."

        print(f"게시글 개수: {post_count}개, 댓글 개수: {comment_count}개")
    except Exception as e:
        print("게시글 및 댓글 수를 가져오는 도중 오류가 발생했습니다:", e)

if __name__ == "__main__":
    gallog_name = input("게시글과 댓글을 확인할 갤러의 아이디를 입력해 주세요: ")
    while True:
        fetch_counts(gallog_name)
        time.sleep(5)  # 5초마다 실행

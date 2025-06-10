import React, { useState, useRef, useEffect } from "react";
import { emoTextList, textToImg, transform } from "@/utils/emotion";
import ChatStore from "@/store/chat";
import userStore from "@/store/user";
import "./index.scss";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  handleVideoCall: () => void;
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  ({ value, onChange, onSend, handleVideoCall }) => {
    const { currentChatInfo, currentFriendId } = ChatStore;
    const { userInfo } = userStore;
    const contentRef = useRef<HTMLDivElement>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
    const [emojiPosition, setEmojiPosition] = useState({ x: 0, y: 0 });
    const emojiBoxRef = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);

    const extractTextFromHtml = (html: string): string => {
      const container = document.createElement("div");
      container.innerHTML = html;
      const images = container.querySelectorAll("img[data-emoji]");
      images.forEach((img) => {
        const emoji = img.getAttribute("data-emoji");
        if (emoji) {
          const textNode = document.createTextNode(`#${emoji};`);
          img.parentNode?.replaceChild(textNode, img);
        }
      });
      // 将<br>标签显式转换为\n
      const brElements = container.querySelectorAll("br");
      brElements.forEach((br) => {
        const textNode = document.createTextNode("\n");
        br.parentNode?.replaceChild(textNode, br);
      });

      return container.textContent?.replace(/\u200B/g, "") || "";
    };

    const transformTextToHtml = (text: string): string => {
      if (!text) return "<br>";
      // 修改点：使用transform工具函数处理表情转换
      const withEmojis = transform(text, "emoji-small");
      // 保留换行符转换逻辑
      return withEmojis.replace(/\n/g, "<br>");
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
      if (contentRef.current) {
        const newValue = extractTextFromHtml(contentRef.current.innerHTML);
        onChange(newValue);
        setIsEmpty(newValue.trim() === "");
      }
    };

    const handleInput = () => {
      if (!contentRef.current || isComposing) return;
      const newValue = extractTextFromHtml(contentRef.current.innerHTML);
      onChange(newValue);
      setIsEmpty(newValue.trim() === "");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.ctrlKey && !isComposing) {
        e.preventDefault();
        // 检查内容是否为空（去除换行符和空格）
        const currentText = extractTextFromHtml(
          contentRef.current?.innerHTML || ""
        );
        if (currentText.trim() === "") {
          return; // 内容为空时不发送
        }
        onSend();
      }
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        contentRef.current?.focus();

        const selection = window.getSelection();
        if (selection && contentRef.current) {
          const range =
            selection.rangeCount > 0
              ? selection.getRangeAt(0).cloneRange()
              : document.createRange();

          // 插入换行符
          const br = document.createElement("br");
          range.deleteContents();
          range.insertNode(br);

          // 创建新的range并设置到换行符后
          const newRange = document.createRange();
          newRange.setStartAfter(br);
          newRange.collapse(true);

          // 更新选区
          selection.removeAllRanges();
          selection.addRange(newRange);
          // 立即触发输入事件
          handleInput();
        }
      }
    };

    const saveSelection = () => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        contentRef.current &&
        contentRef.current.contains(sel.anchorNode)
      ) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };

    const insertEmoji = (emoji: string) => {
      if (!contentRef.current || !emoji) return;

      // 确保输入框获得焦点
      contentRef.current.focus();

      // 延迟执行以确保DOM更新完成
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        // 使用transform获取表情HTML
        const emojiHtml = transform(`#${emoji};`, "emoji-normal");
        const temp = document.createElement("div");
        temp.innerHTML = emojiHtml;

        const img = temp.querySelector("img");
        if (!img) return;

        img.setAttribute("data-emoji", emoji);

        // 获取当前选区
        const range = sel.getRangeAt(0);

        // 插入表情图片
        range.deleteContents();
        range.insertNode(img);

        // 创建新的range并设置到表情后面
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);

        // 更新选区
        sel.removeAllRanges();
        sel.addRange(newRange);

        // 保存新的选区位置
        savedRange.current = newRange.cloneRange();

        // 更新输入框内容
        const newValue = extractTextFromHtml(contentRef.current?.innerHTML);
        onChange(newValue);
        setIsEmpty(newValue.trim() === "");
      }, 0);
    };

    // 外部 value 变化时同步 DOM
    useEffect(() => {
      if (contentRef.current) {
        const currentText = extractTextFromHtml(contentRef.current.innerHTML);
        if (currentText !== value) {
          contentRef.current.innerHTML = transformTextToHtml(value);
          setIsEmpty(value.trim() === "");
          if (!isComposing) {
            setTimeout(() => {
              const range = document.createRange();
              range.selectNodeContents(contentRef.current!);
              range.collapse(false);
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }, 0);
          }
        }
      }
    }, [value, isComposing]);

    // 点击外部关闭表情框
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          emojiBoxRef.current &&
          !emojiBoxRef.current.contains(e.target as Node) &&
          !(e.target as HTMLElement).classList.contains("icon-emoji")
        ) {
          setIsEmojiModalVisible(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleEmojiIconClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setEmojiPosition({ x: rect.left - 8, y: rect.top - 230 });

      // 先聚焦 contentEditable，再保存 selection
      contentRef.current?.focus();
      setTimeout(() => {
        saveSelection();
        setIsEmojiModalVisible((prev) => !prev);
      }, 0);
    };

    return (
      <div className={`chat-input ${isEmpty ? "empty" : ""}`}>
        <div className="chat-tool-bar">
          <div
            title="表情"
            className="icon iconfont icon-emoji chat-tool-item"
            onMouseDown={(e) => e.preventDefault()} // 加这一行
            onClick={handleEmojiIconClick}
          ></div>
          {currentChatInfo.type === 1 &&
            Number(currentFriendId) !== userInfo.id && (
              <div
                title="视频通话"
                className="icon iconfont icon-chat-video chat-tool-item"
                onClick={handleVideoCall}
              ></div>
            )}
        </div>

        <div className="chat-input-area">
          <div
            ref={contentRef}
            className="edit-chat-container"
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onBlur={saveSelection}
            onFocus={saveSelection}
            suppressContentEditableWarning
          />
        </div>

        {/* 表情模态框 */}
        {isEmojiModalVisible && (
          <div
            className="emotion-box"
            ref={emojiBoxRef}
            style={{ left: emojiPosition.x, top: emojiPosition.y }}
          >
            <div className="emotion-items">
              {emoTextList.map((emoji, index) => (
                <div
                  className="emotion-item"
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: textToImg(emoji, "emoji-large"),
                  }}
                  onClick={() => {
                    insertEmoji(emoji);
                    setIsEmojiModalVisible(false);
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ChatInput;

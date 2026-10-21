#!/bin/bash
set -eu
PYTHON="/Users/bytedance/.local/share/wechat-project-pilot/venv/bin/python"
SCRIPT="/Users/bytedance/.local/share/wechat-project-pilot/app/pilot.py"
DATA="/Users/bytedance/Projects/dsh-pm/pm-tool/data/wechat-pilot"

if [ ! -x "$PYTHON" ] || [ ! -f "$SCRIPT" ]; then
  echo "本机试点环境不存在，请按部署说明恢复。"
  read -r _
  exit 2
fi

while true; do
  echo
  echo "微信项目群只读采集试点"
  echo "1. 检查权限（首次使用请选择这一项）"
  echo "2. 设置要采集的项目群"
  echo "3. 采集一次并生成本地动态草稿"
  echo "4. 每 15 分钟定时采集（保持此终端打开，Ctrl+C 停止）"
  echo "5. 打开记录与报告文件夹"
  echo "0. 退出"
  printf "请输入数字："
  read -r selection
  case "$selection" in
    1)
      if "$PYTHON" "$SCRIPT" doctor --request-permissions; then
        echo "权限已就绪。请先设置项目群，再执行一次采集。"
      else
        echo "请在系统设置 → 隐私与安全性，为 Terminal（终端）开启："
        echo "  · 辅助功能"
        echo "  · 屏幕录制（或屏幕与系统音频录制）"
        echo "开启后完全退出终端并重新打开此入口，再检查权限。"
        open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
      fi
      ;;
    2)
      echo "每行输入一个完整群名，空行结束。配置将替换此前的群白名单。"
      group_args=()
      while true; do
        printf "群名："
        read -r group_name
        if [ -z "$group_name" ]; then break; fi
        group_args+=(--group "$group_name")
      done
      if [ "${#group_args[@]}" -eq 0 ]; then
        echo "未输入群名，原配置保留。"
      else
        "$PYTHON" "$SCRIPT" configure "${group_args[@]}" --interval 900 || true
      fi
      ;;
    3)
      "$PYTHON" "$SCRIPT" collect || true
      ;;
    4)
      echo "仅生成本地草稿，不发微信消息。Ctrl+C 停止定时采集。"
      "$PYTHON" "$SCRIPT" watch || true
      ;;
    5)
      open "$DATA"
      ;;
    0)
      exit 0
      ;;
    *)
      echo "请输入上面列出的数字。"
      ;;
  esac
done

---
title: Git
description: 分散型バージョン管理システム
layout: wiki
---
**Git**（ギット）とは、分散型バージョン管理システムである。Linuxカーネルのソースコード管理に用いるために、その開発者であるリーナス・トーバルズによって開発され、それ以降は[Misskey](misskey)をはじめとしたほかの多くのプロジェクトで採用されている。

*[Wikipediaの「Git」の項](https://ja.wikipedia.org/wiki/Git)も参照。*

## 概要
コンピューター上で、文書や画像の古い版（バージョン）と新しい版を両方残したいとき、それぞれを別の名前でコピーして置いておくのが原始的な方法だろう。しかしこの方法では版が多くなってくるとファイル数が膨大になり、管理が不可能になってしまう。

ここで登場するのがGitのようなバージョン管理システムである。  
バージョン管理システムを使えば、ファイルの別名コピーを作ることなく、過去の版を遡って閲覧したり差し戻したりすることが可能となる。

バージョン管理システムは、一つのファイルに対して複数の人が行った変更を統合する時にも役立つ。

バージョン管理システムは、GitのほかにもSubversionなどがある。

## Gitの概念・用語
ひとつの開発プロジェクトをGitでは**リポジトリ (repository)**と呼ぶ（例: 「Misskey」「Mastodon」）。

リポジトリとは、ファイルやディレクトリの変更の記録の全てである。

**リモート (remote)**（クラウドやサーバー）と**ローカル (local)**（開発者のコンピューター）の双方にリポジトリを保持し、差分を適宜やりとりしながら作業を進める。  
リモートは[GitHub](github)にすることが多い（例: https://github.com/syuilo/misskey ）。ローカル用のソフトウェアは各OS向けに配布されている。

変更の差分をローカルからリモートに適用することを**プッシュ (push)**、逆にリモートの変更をローカルに適用することを**プル (pull)**と呼ぶ。  
新たなコンピューターで作業を開始するとき等に、リモートからローカルにリポジトリを全てコピーすることを**クローン (clone)**と呼ぶ。

変更の記録の最小単位は**コミット (commit)**である。
コミットには、ファイルやディレクトリの変更と日時、変更の作成者、ラベル、そして直前のコミットが記録される。
コミットを作成することをコミットすると言う。  
コミットには複数のファイルやディレクトリの変更を記録できる。  
コミットには英数字40桁のIDが付けられ、このIDからひとつのコミットを特定できる。IDは最初の6～7文字程度程度でも十分特定可能なため、省略されることも多い。  
ラベルは、変更内容を書いてコミットがどのような変更なのかわかるようにするための機能である。

コミットの一連のつながりを**ブランチ (branch, 枝)**という。  
ブランチには**分岐（作成）**および**統合（マージ (merge)）**の機能がある。  
ブランチの作成を**ブランチを切る**という呼ぶ習慣がある。  
ブランチ（枝）がいくつも生えている状態を木になぞらえて、リポジトリ内のブランチの構造を**ツリー (tree)**と呼ぶ。

ブランチの地点としてのコミットは**リビジョン**と呼ばれることもある。

## 外部リンク
- [Git公式サイト（英語）](https://git-scm.com/)
- [サルでもわかるGit入門](https://backlog.com/ja/git-tutorial/)
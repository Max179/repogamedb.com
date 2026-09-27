# repo 鈥?鏈湴鐘舵€佹姤鍛婏紙Windows 绔級

**鐘舵€侊細`partial`锛堟暟鎹潰宸叉墦閫氾紝绔欑偣鏈缓锛?* 路 2026-09-25 路 Windows Harness

## 娓告垙鍖咃紙宸茬‘璁わ紝涓嶅啀鏄?blocker锛?| 椤?| 鍊?|
|---|---|
| 鍘嬬缉鍖?| `C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar`锛?.54 GB锛孯AR4锛?|
| 瑙ｅ寘浣嶇疆 | `C:\Users\CHEN\Desktop\repo\data\raw\R.E.P.O.v0.4.0`锛?*鍘熷鏁版嵁鐣欏湪 Windows锛屼笉鍏?Git**锛?|
| 鍙墽琛?| `REPO\REPO.exe` |
| 鐗堟湰鏍囩 | `semiwork REPO`锛坄REPO_Data/app.info`锛夛紱鍖呯洰褰?`R.E.P.O.v0.4.0` |
| 寮曟搸 / 鍚庣 | **Unity** 路 **Mono**锛坄MonoBleedingEdge\EmbedRuntime\mono-2.0-bdwgc.dll`锛?|
| 瑙ｅ寘鍛戒护 | `& 'C:\Program Files\WinRAR\UnRAR.exe' x -o+ -idq '<rar>' '<dest>\'` 鈫?EXIT=0 |

## P0 鎻愬彇锛堝凡纭瘉锛?| 椤?| 鍊?|
|---|---|
| 绋嬪簭闆?| `REPO_Data/Managed/Assembly-CSharp.dll` 2.78 MB |
| 鎬婚噺 | **1,501 绫诲瀷 / 19,505 瀛楁 / 436 涓?P0 鍊欓€夌被 / 130 涓灇涓?* |
| 浜х墿 | `data/normalized/p0-inventory.json` |
| 鎻愬彇鍣?| `pipeline/inventory.ts`锛堝鐢ㄥ弬鑰冮」鐩?ECMA-335 璇诲彇鏋舵瀯锛?*鏈鐢ㄤ换浣曞叾瀹冩父鎴忔暟鎹?*锛?|
| 澶嶇幇 | `node --experimental-strip-types pipeline/inventory.ts` |

浠ｈ〃鎬?P0 绫伙紙宸茶В鏋愬瓧娈靛悕涓庣被鍨嬶級锛歚ShopKeeper` 118 路 `ExtractionPoint` 103 路 `EnemyOogly` 77 路 `EnemyHeartHugger` 69 路
`UpgradeStand` 60 路 `CosmeticShopMachineAnimator` 59 路 `StatsManager` 53 路 `ItemWalkieTalkie` 53 路 `ItemGun` 44 路
`Level` 43锛堝惈 `NarrativeName:string`銆乣NarrativeNameLocalized:LocalizedAsset`锛夈€?
鐪熷疄鏋氫妇锛堟父鎴忚嚜韬暟鍊硷級锛歚EnemyState` 12锛坄None=0,Spawn=1,Roaming=2,ChaseBegin=3,Chase=4鈥锛壜?`EnemyType` 5
锛坄VeryLight=0鈥eryHeavy=4`锛壜?`State` 12 路 `State` 8 路 `Status` 4銆?
## 璧勬簮闈?`resources.assets` 198.5 MB锛? resS 698.9 MB锛壜?`sharedassets0.assets` 64.1 MB锛? resS 356.9 MB锛壜?`globalgamemanagers` 55.8 MB 路 `level0/1/2` 鍚?~0.4鈥?.5 MB銆?
## 鏈畬鎴?1. 瀹炰緥鍊硷細闇€鍏堢‘璁よ鏋勫缓鐨?SerializedFile 鐗堟湰锛堟帰閽堢粨鏋滆 `reports/container-probe.txt`锛夈€?2. P0 瑙勮寖鍖栧疄浣擄紙鐗╁搧/璐甸噸鐗┿€佹晫浜恒€佽澶囥€佸湴鐐广€佺洰鏍囥€佸嵄闄╀笌鍙牳楠屾暟鍊硷級锛屾瘡瀛楁甯?source/version/checked/confidence锛寀nknown 鏄惧紡鏍囨敞銆?3. 闈欐€佺珯锛坔ome/search/collection/entity/guide/tool/sources/about/contact/disclaimer/privacy/terms锛? 娴嬭瘯 + typecheck + production build銆?
## Mac handoff锛坰ource-only锛?`Desktop\repo`锛氭彁鍙栬剼鏈€丳0 娓呭崟锛堝惈鏋氫妇锛夈€佹姤鍛娿€佸鐜板懡浠ゃ€?*娓告垙鍖呬笌瑙ｅ寘鍘熷鏁版嵁鐣欏湪 Windows銆?*

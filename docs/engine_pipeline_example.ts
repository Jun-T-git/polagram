export class TransformationEngine {
    public transform(root: PolagramRoot, rules: TransformRule[]): PolagramRoot {
        let currentAst = root;

        // フェーズ1: 意図的変換 (Filters)
        // ユーザーが指定したルール（Focus, Remove...）を順に適用
        // ここでは「空の箱」ができても気にせず、とにかく対象を消したり残したりする
        for (const rule of rules) {
            const filter = registry.getFilter(rule);
            if (filter) {
                currentAst = filter.transform(currentAst);
            }
        }

        // フェーズ2: 整合性維持 (Sanitizers)
        // 最後にまとめて「構造的なゴミ掃除」と「参照の整理」を行う
        // これらはルールに関係なく、常に実行される「品質保証」プロセス
        
        // 2-1. 構造サニタイズ: 中身が空になったFragmentなどを削除
        currentAst = new StructureSanitizer().transform(currentAst);

        // 2-2. 参照サニタイズ: 誰も使っていないParticipant定義を削除
        currentAst = new ReferenceSanitizer().transform(currentAst);

        return currentAst;
    }
}

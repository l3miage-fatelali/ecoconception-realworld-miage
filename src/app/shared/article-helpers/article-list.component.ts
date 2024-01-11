import { Component, Input, OnDestroy } from "@angular/core";
import { ArticlesService } from "../../core/services/articles.service";
import { ArticleListConfig } from "../../core/models/article-list-config.model";
import { Article } from "../../core/models/article.model";
import { ArticlePreviewComponent } from "./article-preview.component";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { LoadingState } from "../../core/models/loading-state.model";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-article-list",
  templateUrl: "./article-list.component.html",
  imports: [ArticlePreviewComponent, NgForOf, NgClass, NgIf],
  standalone: true,
})
export class ArticleListComponent implements OnDestroy {
  query!: ArticleListConfig;
  results: Article[] = [];
  currentPage = 1;
  totalPages: Array<number> = [];
  loading = LoadingState.NOT_LOADED;
  LoadingState = LoadingState;
  destroy$ = new Subject<void>();

  @Input() limit!: number;
  @Input()
  set config(config: ArticleListConfig) {
    if (config) {
      this.query = config;
      this.currentPage = 1;
      this.runQuery();
    }
  }

  constructor(private articlesService: ArticlesService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPageTo(pageNumber: number) {
    const votreElement = document.getElementById("body");

    if (votreElement) {
      votreElement.style.cursor = "wait";
    }
    setTimeout(() => {
      if (votreElement) {
        votreElement.style.cursor = "auto";
      }
      this.currentPage = pageNumber;
      this.runQuery();
    }, 5000);
  }

  runQuery() {
    this.loading = LoadingState.LOADING;
    this.results = [];

    // Create limit and offset filter (if necessary)
    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = this.limit * (this.currentPage - 1);
    }

    this.articlesService
      .query(this.query)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.loading = LoadingState.LOADED;
        this.results = data.articles;
        console.log(this.results);

        let myResult: any[] = [];
        this.results.forEach((element) => {
          let retour = this.articlesService
            .get(element.slug)
            .pipe(takeUntil(this.destroy$))
            .subscribe((elem) => {
              console.log(elem);
              myResult.push(elem);
            });
        });
        this.results = myResult;
        // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
        this.totalPages = Array.from(
          new Array(Math.ceil(data.articlesCount / this.limit)),
          (val, index) => index + 1
        );
      });
  }
}
